import { Web3Storage } from "web3.storage";

const web3storage_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDg4NzgwQzhEMTk1MmZGMmI0REFjRjM1MzIzNTgwQzUwODJGRjVlZmQiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzkwNjQ2OTc5MzMsIm5hbWUiOiJkY3N6ZnNkZnNkZmRzIn0.N5piKkzDVxdCOo_9qXHu9YgLc2Xd67rLs7LZNM3vLZY";

export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function GetAccessToken() {
  return web3storage_key;
}

function MakeStorageClient() {
  return new Web3Storage({ token: GetAccessToken() });
}

export const ipfsSaveContent = async (files) => {
  console.log("Uploading files to IPFS with web3.storage....");
  const client = MakeStorageClient();
  const cid = await client.put([files]);
  console.log("Stored files with cid:", cid);
  return cid;
};
