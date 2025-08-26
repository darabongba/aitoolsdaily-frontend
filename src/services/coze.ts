import { CozeAPI } from '@coze/api';

const apiClient = new CozeAPI({
  token: 'pat_XZJfKT9AEhr6CEcZT1dPYmGqCRmVMvWSFfAfiL9Ff30FOPdEsRZ6UKzJrrtHw6e8',
  baseURL: 'https://api.coze.cn',
  allowPersonalAccessTokenInBrowser: true
});

export const runCozeWorkflow = async (workflow_id: string, parameters: any) => {
  try {
    const res = await apiClient.workflows.runs.create({
      workflow_id: workflow_id,
      parameters: parameters,
      
    });
    return res;
  } catch (error) {
    console.error('Coze API Error:', error);
    throw error;
  }
};