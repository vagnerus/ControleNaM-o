
import { firebaseConfig } from './src/firebase/config';
import { initializeApp } from 'firebase/app';

console.log('Testing Firebase Initialization...');
console.log('Config:', firebaseConfig);

try {
  const app = initializeApp(firebaseConfig);
  console.log('Initialization success:', app.name);
} catch (error) {
  console.error('Initialization failed:', error);
}
