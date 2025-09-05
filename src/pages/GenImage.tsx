import { useState } from 'react';
import { Upload, Card, Button, Spin, message, Typography } from 'antd';
import { InboxOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import YpyunUploader from '../services/ypyun';
import { runCozeWorkflow } from '../services/coze';

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

export default function GenImage() {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [result, setResult] = useState<string>('');

  // 创建又拍云上传实例
  const uploader = new YpyunUploader();

  const handleUpload = async (file: File) => {
    setUploading(true);
    setResult('');
    
    try {
      // 生成文件保存路径
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const saveKey = `/ai/${fileName}`;

      // 上传到又拍云
      const uploadResult = await uploader.uploadFile(file, saveKey, {
        'allow-file-type': 'jpg,jpeg,png,gif,webp',
        'content-length-range': '0,10485760' // 限制10MB以内
      });

      console.log('Upload result:', uploadResult);
      
      // 构建图片URL
      const fullImageUrl = `http://dumpling-image-store.test.upcdn.net${saveKey}`;
      setImageUrl(fullImageUrl);
      message.success('图片上传成功！');

    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const processImage = async () => {
    if (!imageUrl) return;
    
    setProcessing(true);
    
    try {
      const response = await runCozeWorkflow('7543155784399323199', { url: imageUrl });
      console.log('Response:', response);
      const data =JSON.parse(response.data);
      // @ts-ignore
      setResult(data?.data);
      message.success('图片处理完成！');
    } catch (error: any) {
      console.error('Process error:', error);
      message.error(`处理失败: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    beforeUpload: (file: File) => {
      handleUpload(file);
      return false; // 阻止默认上传
    },
    showUploadList: false,
  };

  return (
    <div style={{  maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 上传区域 */}
      <Card title="选择图片" style={{ marginBottom: '24px' }}>
        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? '正在上传...' : '点击或拖拽图片到此区域上传'}
          </p>
          <p className="ant-upload-hint">
            支持 JPG、PNG、GIF、WEBP 格式，文件大小不超过 10MB
          </p>
        </Dragger>
      </Card>

      {/* 图片预览和提交区域 */}
      {imageUrl && (
        <div>
                  <Card title="上传的图片" style={{ marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <img 
              src={imageUrl} 
              alt="uploaded" 
              style={{ 
                margin: '0 auto',
                width: '60%', 
                maxHeight: '400px', 
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }} 
            />

          </div>
        </Card>
          <div style={{ marginTop: '20px',textAlign: 'center',marginBottom: '20px' }}>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                loading={processing}
                onClick={processImage}
                style={{ fontSize: '16px', height: '48px', paddingLeft: '24px', paddingRight: '24px' }}
              >
                {processing ? '处理中...' : '提交给 Coze 工作流处理'}
              </Button>
            </div>
        </div>

        
      )}

      {/* 处理状态 */}
      {processing && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>正在处理图片，请稍候...</p>
          </div>
        </Card>
      )}

      {/* 处理结果 */}
      {result && (
        <Card title="处理结果" style={{ marginBottom: '24px' }}>
          <div 
            style={{ 
              background: '#f9f9f9', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              maxHeight: '600px',
              overflowY: 'auto',
              width: '300px',
              margin:'0 auto'
            }}
          >
            <ReactMarkdown
              components={{
                // 自定义样式
                h1: ({children}) => <h1 style={{color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px'}}>{children}</h1>,
                h2: ({children}) => <h2 style={{color: '#1890ff', borderBottom: '1px solid #d9d9d9', paddingBottom: '4px'}}>{children}</h2>,
                h3: ({children}) => <h3 style={{color: '#1890ff'}}>{children}</h3>,
                p: ({children}) => <p style={{lineHeight: '1.6', marginBottom: '12px'}}>{children}</p>,
                ul: ({children}) => <ul style={{paddingLeft: '20px', marginBottom: '12px'}}>{children}</ul>,
                ol: ({children}) => <ol style={{paddingLeft: '20px', marginBottom: '12px'}}>{children}</ol>,
                li: ({children}) => <li style={{marginBottom: '4px'}}>{children}</li>,
                code: ({children}) => <code style={{background: '#f0f0f0', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace'}}>{children}</code>,
                pre: ({children}) => <pre style={{background: '#f0f0f0', padding: '12px', borderRadius: '6px', overflow: 'auto', fontFamily: 'monospace'}}>{children}</pre>,
                blockquote: ({children}) => <blockquote style={{borderLeft: '4px solid #1890ff', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: '#666'}}>{children}</blockquote>,
                table: ({children}) => <table style={{borderCollapse: 'collapse', width: '100%', marginBottom: '16px'}}>{children}</table>,
                th: ({children}) => <th style={{border: '1px solid #d9d9d9', padding: '8px', background: '#fafafa', textAlign: 'left'}}>{children}</th>,
                td: ({children}) => <td style={{border: '1px solid #d9d9d9', padding: '8px'}}>{children}</td>,
              }}
            >
              {result}
            </ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}