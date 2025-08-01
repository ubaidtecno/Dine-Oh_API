require("dotenv").config({ path: "../.env" });

module.exports = {
  aws: {
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  s3: {
    bucket: process.env.BUCKET,
  },
};
