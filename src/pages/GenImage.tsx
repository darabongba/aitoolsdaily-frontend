import { useState, useEffect } from 'react';
import { Upload, Card, Button, Spin, message, Typography, Tabs, Empty, Popconfirm } from 'antd';
import { InboxOutlined, SendOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import YpyunUploader from '../services/ypyun';
import { runCozeWorkflow } from '../services/coze';
import { db, GenImageRecord } from '../db';

const { Dragger } = Upload;
const { Title } = Typography;

// 保持接口兼容性
interface HistoryRecord {
  id: string;
  originalImage: string;
  resultImages: string[];
  markdown: string;
  timestamp: number;
  title?: string;
}

export default function GenImage() {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [bgImageUrl, setBgImageUrl] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState('upload');

  // 创建又拍云上传实例
  const uploader = new YpyunUploader();


  // 加载历史记录
  const loadHistory = async () => {
    try {
      const records = await db.genImages
        .orderBy('timestamp')
        .reverse()
        .toArray();
      
      const historyRecords: HistoryRecord[] = records.map(record => ({
        id: record.id,
        originalImage: record.originalImage,
        resultImages: record.resultImages,
        markdown: record.markdown,
        timestamp: record.timestamp,
        title: record.title
      }));
      
      setHistory(historyRecords);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      message.error('加载历史记录失败');
    }
  };

  // 保存历史记录
  const saveHistoryRecord = async (record: HistoryRecord) => {
    try {
      const genImageRecord: GenImageRecord = {
        ...record,
        createdAt: new Date(record.timestamp)
      };
      
      await db.genImages.add(genImageRecord);
      
      // 重新加载历史记录
      await loadHistory();
    } catch (error) {
      console.error('保存历史记录失败:', error);
      message.error('保存历史记录失败');
    }
  };

  // 删除历史记录
  const deleteHistoryRecord = async (id: string) => {
    try {
      await db.genImages.delete(id);
      await loadHistory();
      message.success('删除成功');
    } catch (error) {
      console.error('删除历史记录失败:', error);
      message.error('删除失败');
    }
  };

  // 清空所有历史记录
  const clearAllHistory = async () => {
    try {
      await db.genImages.clear();
      await loadHistory();
      message.success('已清空所有历史记录');
    } catch (error) {
      console.error('清空历史记录失败:', error);
      message.error('清空失败');
    }
  };

  // 初始化
  useEffect(() => {
    const init = async () => {
      await loadHistory();
    };
    
    init();
  }, []);

  // 从markdown中提取图片URL
  const extractImageUrls = (markdown: string): string[] => {
    const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
    const urls: string[] = [];
    let match;
    
    while ((match = imageRegex.exec(markdown)) !== null) {
      urls.push(match[1]);
    }
    
    return urls;
  };

  const handleUpload = async (file: File, isBgImage: boolean = false) => {
    setUploading(true);
    if (!isBgImage) {
      setResult('');
    }
    
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
      
      if (isBgImage) {
        setBgImageUrl(fullImageUrl);
        message.success('背景图片上传成功！');
      } else {
        setImageUrl(fullImageUrl);
        message.success('主图上传成功！');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const processImage = async (type: number = 1, bgUrl?: string) => {
    if (!imageUrl) return;
    
    setProcessing(true);
    
    try {
      const parameters: any = { url: imageUrl, type };
      if (bgUrl) {
        parameters.bgUrl = bgUrl;
      }
      
      const response = await runCozeWorkflow('7543155784399323199', parameters);
      console.log('Response:', response);
      const data = JSON.parse(response.data);
      
      // 根据不同类型获取不同的返回参数
      let resultMarkdown = '';
      switch (type) {
        case 1:
          resultMarkdown = data?.data || '';
          break;
        case 2:
          resultMarkdown = data?.bgchange || '';
          break;
        case 3:
          resultMarkdown = data?.cutout || '';
          break;
        case 4:
          resultMarkdown = data?.style || '';
          break;
        case 5:
          resultMarkdown = data?.face || '';
          break;
        default:
          resultMarkdown = data?.data || '';
      }
      
      setResult(resultMarkdown);
      
      // 提取图片URL并保存到历史记录
      const resultImages = extractImageUrls(resultMarkdown);
      const typeNames = ['', '图生图', '背景替换', '抠图', '风格滤镜', '智能换脸'];
      const newRecord: HistoryRecord = {
        id: Date.now().toString(),
        originalImage: imageUrl,
        resultImages,
        markdown: resultMarkdown,
        timestamp: Date.now(),
        title: `${typeNames[type]} ${new Date().toLocaleString()}`
      };
      
      // 保存到IndexedDB
      await saveHistoryRecord(newRecord);
      
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

  const bgUploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    beforeUpload: (file: File) => {
      handleUpload(file, true);
      return false; // 阻止默认上传
    },
    showUploadList: false,
  };

  // 单图片处理组件
  const SingleImageProcessor = ({ type, title, buttonText }: { type: number; title: string; buttonText: string }) => (
    <div>
      <Card title={title} style={{ marginBottom: '24px' }}>
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
          <div style={{ marginTop: '20px', textAlign: 'center', marginBottom: '20px' }}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={processing}
              onClick={() => processImage(type)}
              style={{ fontSize: '16px', height: '48px', paddingLeft: '24px', paddingRight: '24px' }}
            >
              {processing ? '处理中...' : buttonText}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // 双图片处理组件
  const DoubleImageProcessor = ({ type, buttonText }: { type: number; title: string; buttonText: string }) => (
    <div>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <Card title="主图" style={{ height: '100%' }}>
            <Dragger {...uploadProps} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {uploading ? '正在上传...' : '上传主图'}
              </p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、GIF、WEBP 格式
              </p>
            </Dragger>
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <Card title="背景图" style={{ height: '100%' }}>
            <Dragger {...bgUploadProps} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {uploading ? '正在上传...' : '上传背景图'}
              </p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、GIF、WEBP 格式
              </p>
            </Dragger>
          </Card>
        </div>
      </div>

      {(imageUrl || bgImageUrl) && (
        <Card title="预览" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            {imageUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>主图</div>
                <img 
                  src={imageUrl} 
                  alt="main" 
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
              </div>
            )}
            {bgImageUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>背景图</div>
                <img 
                  src={bgImageUrl} 
                  alt="background" 
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {imageUrl && bgImageUrl && (
        <div style={{ marginTop: '20px', textAlign: 'center', marginBottom: '20px' }}>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={processing}
            onClick={() => processImage(type, bgImageUrl)}
            style={{ fontSize: '16px', height: '48px', paddingLeft: '24px', paddingRight: '24px' }}
          >
            {processing ? '处理中...' : buttonText}
          </Button>
        </div>
      )}
    </div>
  );

  // 瀑布流组件
  const WaterfallGrid = ({ records }: { records: HistoryRecord[] }) => {
    if (records.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="暂无历史记录" />
        </div>
      );
    }

    return (
      <div style={{ 
        columns: '3 300px',
        columnGap: '16px',
        padding: '16px'
      }}>
        {records.map((record) => (
          <div key={record.id} style={{ 
            breakInside: 'avoid',
            marginBottom: '16px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease'
          }}>
            {/* 原图 */}
            <div style={{ position: 'relative' }}>
              <img 
                src={record.originalImage} 
                alt="原图"
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                原图
              </div>
            </div>

            {/* 处理结果图片 */}
            {record.resultImages.map((imgUrl, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img 
                  src={imgUrl} 
                  alt={`结果图 ${index + 1}`}
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(24, 144, 255, 0.8)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  结果 {index + 1}
                </div>
              </div>
            ))}

            {/* 信息区域 */}
            <div style={{ padding: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#333',
                  flex: 1
                }}>
                  {record.title}
                </div>
                <Popconfirm
                  title="确定要删除这条记录吗？"
                  onConfirm={() => deleteHistoryRecord(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<DeleteOutlined />}
                    style={{ color: '#ff4d4f' }}
                  />
                </Popconfirm>
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginBottom: '8px'
              }}>
                {new Date(record.timestamp).toLocaleString()}
              </div>
              {record.resultImages.length > 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#1890ff'
                }}>
                  生成了 {record.resultImages.length} 张图片
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const tabItems = [
    {
      key: 'upload',
      label: (
        <span style={{ color: activeTab === 'upload' ? 'rgba(24, 144, 255, 0.8)' : 'gray' }}>
          <SendOutlined />
          图生图
        </span>
      ),
      children: (
        <div>
          <SingleImageProcessor type={1} title="选择图片" buttonText="提交给 Coze 工作流处理" />
          
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
                  overflowY: 'auto'
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
      ),
    },
    {
      key: 'background',
      label: (
        <span style={{ color: activeTab === 'background' ? 'rgba(24, 144, 255, 0.8)' : 'gray' }}>
          🎨 背景替换
        </span>
      ),
      children: (
        <div>
          <DoubleImageProcessor type={2} title="背景替换" buttonText="开始背景替换" />
          
          {processing && (
            <Card style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>正在处理背景替换，请稍候...</p>
              </div>
            </Card>
          )}

          {result && (
            <Card title="处理结果" style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  background: '#f9f9f9', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'cutout',
      label: (
        <span style={{ color: activeTab === 'cutout' ? 'rgba(24, 144, 255, 0.8)' : 'gray' }}>
          ✂️ 抠图
        </span>
      ),
      children: (
        <div>
          <SingleImageProcessor type={3} title="选择要抠图的图片" buttonText="开始抠图处理" />
          
          {processing && (
            <Card style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>正在进行抠图处理，请稍候...</p>
              </div>
            </Card>
          )}

          {result && (
            <Card title="处理结果" style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  background: '#f9f9f9', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'style',
      label: (
        <span style={{ color: activeTab === 'style' ? 'rgba(24, 144, 255, 0.8)' : 'gray' }}>
          🎭 风格滤镜
        </span>
      ),
      children: (
        <div>
          <SingleImageProcessor type={4} title="选择要添加风格滤镜的图片" buttonText="应用风格滤镜" />
          
          {processing && (
            <Card style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>正在应用风格滤镜，请稍候...</p>
              </div>
            </Card>
          )}

          {result && (
            <Card title="处理结果" style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  background: '#f9f9f9', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'face',
      label: (
        <span style={{ color: activeTab === 'face' ? 'rgba(24, 144, 255, 0.8)' : 'gray' }}>
          👤 智能换脸
        </span>
      ),
      children: (
        <div>
          <DoubleImageProcessor type={5} title="智能换脸" buttonText="开始换脸处理" />
          
          {processing && (
            <Card style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>正在进行智能换脸，请稍候...</p>
              </div>
            </Card>
          )}

          {result && (
            <Card title="处理结果" style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  background: '#f9f9f9', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span style={{ color: activeTab === 'history' ? 'rgba(24, 144, 255, 0.8)' : 'gray' }}>
          <HistoryOutlined />
          历史记录 ({history.length})
        </span>
      ),
      children: (
        <div>
          {history.length > 0 && (
            <div style={{ marginBottom: '16px', textAlign: 'right' }}>
              <Popconfirm
                title="确定要清空所有历史记录吗？此操作不可恢复！"
                onConfirm={clearAllHistory}
                okText="确定"
                cancelText="取消"
                okType="danger"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  清空所有记录
                </Button>
              </Popconfirm>
            </div>
          )}
          <WaterfallGrid records={history} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        图片处理工作台
      </Title>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
}