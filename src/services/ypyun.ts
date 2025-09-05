import CryptoJS from 'crypto-js';

interface YpyunConfig {
  bucket?: string;
  operator?: string;
  password?: string;
  endpoint?: string;
  url?: string;
}

interface PolicyData {
  bucket: string;
  'save-key': string;
  expiration: number;
  'content-length-range'?: string;
  'allow-file-type'?: string;
  'content-md5'?: string;
}

class YpyunUploader {
  private config: YpyunConfig;
  
  constructor(config: YpyunConfig = {}) {
    this.config = {
      endpoint: 'v0.api.upyun.com',      
      ...config,
      bucket:'dumpling-image-store',
      operator:'zyp',
      password:'faDEofC8eLLkZNQrWHdbKGLsOFwvByn3'
    };
  }


  // 字符串转 base64（浏览器兼容）
  private toBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }


  // 计算 MD5
  private calculateMD5(content: string | ArrayBuffer): string {
    if (typeof content === 'string') {
      return CryptoJS.MD5(content).toString();
    } else {
      // 将 ArrayBuffer 转换为 WordArray
      const wordArray = CryptoJS.lib.WordArray.create(content);
      return CryptoJS.MD5(wordArray).toString();
    }
  }

  // 生成 HMAC-SHA1 签名
  private hmacSha1(secret: string, value: string): string {
    const hash = CryptoJS.HmacSHA1(value, secret);
    return CryptoJS.enc.Base64.stringify(hash);
  }

  // 生成 policy
  private generatePolicy(saveKey: string,contentMd5: string,  options: Partial<PolicyData> = {}): string {
    const policy: PolicyData = {
      bucket: this.config.bucket || '',
      'save-key': saveKey,
      expiration: Math.floor(Date.now() / 1000) + 1800, // 30分钟过期
      'content-md5': contentMd5,
      ...options
    };
    
    return this.toBase64(JSON.stringify(policy));
  }

  // 生成签名 - 根据又拍云FORM API文档
  private generateSignature(method: string, uri: string, date: string, policy: string, contentMd5?: string): string {
    // 按照又拍云FORM API签名规则: Method&URI&Date&Policy&Content-MD5
    // 参考文档: https://help.upyun.com/knowledge-base/object_storage_authorization/#e694bee59ca8-http-body-e4b8ad
    
    const elements = [];
    
    // Method - 必选
    elements.push(method);
    
    // URI - 必选  
    elements.push(uri);
    
    // Date - 可选，根据文档，非必选参数为空时连同后面的&一起不参与签名计算
    if (date && date.trim()) {
      elements.push(date);
    }
    
    // Policy - 必选
    elements.push(policy);
    
    // Content-MD5 - 可选
    if (contentMd5) {
      elements.push(contentMd5);
    }
    
    const stringToSign = elements.join('&');
    
    // 密码需要先MD5加密再用于HMAC-SHA1
    const passwordMd5 = this.calculateMD5(this.config.password || '');
    
    // 生成HMAC-SHA1签名
    const signature = this.hmacSha1(passwordMd5, stringToSign);
    return `UPYUN ${this.config.operator}:${signature}`;
  }

  // 上传文件
  async uploadFile(file: File | Blob, saveKey: string, options: Partial<PolicyData> = {}): Promise<any> {
    const method = 'POST';
    const uri = `/${this.config.bucket}`;
    
    
    // 如果文件较小，计算 MD5
    let contentMd5: string | undefined;
    if (file.size <= 10 * 1024 * 1024) { // 10MB以下计算MD5
      const buffer = await file.arrayBuffer();
      contentMd5 = this.calculateMD5(buffer);
    }
    const policy = this.generatePolicy(saveKey,contentMd5 || '', options);

    // FORM API通常不使用Date参数，传空字符串
    const authorization = this.generateSignature(method, uri, '', policy, contentMd5);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('policy', policy);
    formData.append('authorization', authorization);
    if (contentMd5) {
      formData.append('content-md5', contentMd5);
    }

    try {
      const response = await fetch(`https://${this.config.endpoint}${uri}`, {
        method,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // 有些情况下又拍云返回的不是JSON
        const text = await response.text();
        return { message: 'Upload successful', response: text };
      }
    } catch (error: any) {
      throw new Error(`Upload error: ${error?.message || 'Unknown error'}`);
    }
  }
}

export default YpyunUploader;