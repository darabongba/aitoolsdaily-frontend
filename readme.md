# AI Tools Web Page

一个基于React和TypeScript的AI工具Web应用，集成了Coze API，用于生成思维导图和其他AI功能。

## 功能特性

### 1. 脑图生成
- 支持URL和文本输入
- 实时生成思维导图
- Markdown格式展示
- 历史记录管理
- 展开/收起视图控制

### 2. 安全认证
- 用户名密码登录
- 多重加密保护
- 登录尝试限制
- Token基础的会话管理
- 自动登出机制

### 3. 数据存储
- 使用IndexDB本地存储
- 自动清理过期数据
- 历史记录管理
- 安全的数据加密

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Dexie.js (IndexDB)
- CryptoJS
- React Router
- React Markdown
- Coze API

## 安装说明

1. 克隆项目
```bash
git clone [repository-url]
cd aiToolsWebPage
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

## 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

## 项目结构

```
src/
├── components/        # 组件目录
│   ├── common/       # 通用组件
│   └── AuthGuard.tsx # 路由守卫
├── pages/            # 页面组件
│   ├── HomePage.tsx  # 主页
│   └── LoginPage.tsx # 登录页
├── services/         # 服务层
│   ├── coze.ts      # Coze API服务
│   └── auth.ts      # 认证服务
├── utils/           # 工具函数
│   └── crypto.ts    # 加密工具
├── config/          # 配置文件
├── db/              # 数据库配置
└── App.tsx          # 应用入口
```

## 使用说明

### 登录
- 默认用户名和密码已通过加密方式存储
- 登录失败5次后将被限制15分钟
- 登录成功后token有效期为一个月

### 脑图生成
1. 选择输入类型（URL/文本）
2. 输入内容
3. 点击提交按钮
4. 等待生成结果
5. 查看生成的思维导图

### 历史记录
- 在历史记录标签页查看所有生成记录
- 使用展开/收起功能查看详细内容
- 按时间倒序排列

## 安全说明

- 所有敏感信息都经过多重加密
- 使用加盐哈希进行密码验证
- 实现了防暴力破解机制
- 自动清理过期的认证信息

## 开发说明

### 构建生产版本
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npm run type-check
```

### 格式化代码
```bash
npm run format
```

## 注意事项

1. 请定期更换加密密钥以提高安全性
2. 建议定期清理本地存储的历史记录
3. 避免在公共设备上保持登录状态
4. 确保Coze API Token的安全性

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License