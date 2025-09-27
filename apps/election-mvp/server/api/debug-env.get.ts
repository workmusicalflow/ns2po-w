export default defineEventHandler(async (event) => {
  return {
    nodeEnv: process.env.NODE_ENV,
    cloudinaryVars: {
      cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: !!process.env.CLOUDINARY_API_KEY,
      apiSecret: !!process.env.CLOUDINARY_API_SECRET,
    },
    runtimeConfig: useRuntimeConfig(),
    allCloudinaryEnvs: Object.keys(process.env)
      .filter(key => key.includes('CLOUDINARY'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? '***set***' : 'undefined';
        return acc;
      }, {} as Record<string, string>)
  };
});