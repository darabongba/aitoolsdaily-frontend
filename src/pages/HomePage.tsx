import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { runCozeWorkflow } from '../services/coze';
import { db } from '../db';
import { Tabs } from '../components/common/Tabs';
import { ButtonGroup } from '../components/common/ButtonGroup';

const tabs = [
  { id: 'generate', label: '脑图生成' },
  { id: 'history', label: '历史记录' }
];

const inputTypes = [
  { label: 'URL', value: 'url' },
  { label: '文本', value: 'text' }
];

const HistoryItem: React.FC<{
  url: string;
  markdown: string;
  createdAt: Date;
}> = ({ url, markdown, createdAt }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {createdAt.toLocaleString()}
        </div>
        <div className="text-blue-500 truncate max-w-md">
          {url}
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-24'}`}>
        <div className="prose max-w-none">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        {isExpanded ? (
          <>
            <ChevronUp size={16} />
            <span>收起</span>
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            <span>展开</span>
          </>
        )}
      </button>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [inputType, setInputType] = useState('url');

  const records = useLiveQuery(
    () => db.mindMaps.orderBy('createdAt').reverse().toArray()
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await runCozeWorkflow('7541292697510264884', { 
        input: url,
        type: inputType 
      });
      const parsedData = JSON.parse(response.data);
      const markdownData = parsedData.data;
      
      setMarkdownContent(markdownData);
      
      // 保存到数据
      await db.mindMaps.add({
        url,
        markdown: markdownData,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error:', error);
      setMarkdownContent('处理结果时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'generate') {
      return (
        <>
          <div className="flex flex-col gap-5">
            <ButtonGroup
              options={inputTypes}
              value={inputType}
              onChange={setInputType}
            />
            <div className="flex gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={inputType === 'url' ? '请输入链接' : '请输入文本内容'}
                className="h-12 flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '处理中...' : '提交'}
            </button>
          </div>
          
          {markdownContent && (
            <div className="mt-8 p-4 border rounded-lg bg-white">
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
          )}
        </>
      );
    }

    return (
      <div className="space-y-4 h-[calc(100vh-400px)] overflow-y-auto">
        {records?.map((record) => (
          <HistoryItem
            key={record.id}
            url={record.url}
            markdown={record.markdown}
            createdAt={record.createdAt}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-8 p-4 ${activeTab === 'generate' ? 'max-w-2xl mx-auto' : ''}`}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </div>
  );
};

export default HomePage;