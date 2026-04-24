import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";

const hasCloudinaryConfig = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: String(env.CLOUDINARY_CLOUD_NAME),
    api_key: String(env.CLOUDINARY_API_KEY),
    api_secret: String(env.CLOUDINARY_API_SECRET),
    secure: true
  });
}

function buildObjectKey(prefix: string, fileName: string) {
  const safeName = String(fileName || "proof.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${Date.now()}_${safeName}`;
}

function uploadBufferToCloudinary(buffer: Buffer, publicId: string, mimeType: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: publicId,
        folder: env.CLOUDINARY_FOLDER,
        overwrite: false
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    upload.end(buffer);
  });
}

export async function uploadPaymentProof(args: {
  userId: string;
  paymentId: string;
  fileName: string;
  mimeType: string;
  body: Buffer;
}) {
  const key = buildObjectKey(`payment-proofs/${args.userId}/${args.paymentId}`, args.fileName);

  if (!hasCloudinaryConfig) {
    return {
      key,
      url: `https://mock-cloudinary.local/${key}`,
      mocked: true
    };
  }

  const uploaded = await uploadBufferToCloudinary(args.body, key, args.mimeType);

  return {
    key: uploaded.public_id,
    url: uploaded.secure_url,
    mocked: false
  };
}