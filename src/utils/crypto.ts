import CryptoJS from 'crypto-js';

// 多重加密密钥
const KEYS = {
  PRIMARY: '8a7b6c5d4e3f2g1h',
  SECONDARY: '9i8j7k6l5m4n3o2p',
  SALT: '1q2w3e4r5t6y7u8i'
};

export const encrypt = (text: string): string => {
  // 多重加密
  const firstLayer = CryptoJS.AES.encrypt(text, KEYS.PRIMARY).toString();
  const secondLayer = CryptoJS.AES.encrypt(firstLayer, KEYS.SECONDARY).toString();
  return secondLayer;
};

export const decrypt = (ciphertext: string): string => {
  try {
    // 多重解密
    const secondLayer = CryptoJS.AES.decrypt(ciphertext, KEYS.SECONDARY).toString(CryptoJS.enc.Utf8);
    const firstLayer = CryptoJS.AES.decrypt(secondLayer, KEYS.PRIMARY).toString(CryptoJS.enc.Utf8);
    return firstLayer;
  } catch {
    return '';
  }
};

export const hash = (text: string): string => {
  // 加盐哈希
  return CryptoJS.SHA256(text + KEYS.SALT).toString();
};
