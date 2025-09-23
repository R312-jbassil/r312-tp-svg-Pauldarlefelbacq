import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

export default pb;
