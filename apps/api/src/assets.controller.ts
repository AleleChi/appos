import { Controller, Post, Body, Req, UseGuards, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { v2 as cloudinary } from "cloudinary";

@Controller("api/v1/assets")
@UseGuards(AuthGuard)
export class AssetsController {
  @Post("sign-upload")
  async signUpload(@Body() body: any, @Req() req: any) {
    const { folder } = body;
    if (!folder || typeof folder !== "string") {
      throw new BadRequestException("Target folder path is required.");
    }

    // Strict regex validation for folders
    const allowedFolderRegex = /^appos\/(users\/[a-zA-Z0-9_-]+\/avatars|workspaces\/[a-zA-Z0-9_-]+\/(logos|screenshots)|applications\/[a-zA-Z0-9_-]+\/assets)$/;
    if (!allowedFolderRegex.test(folder)) {
      throw new BadRequestException("Unauthorized directory folder path. Signature rejected.");
    }

    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = { timestamp, folder };

      const signature = cloudinary.utils.sign_request(paramsToSign, {
        api_secret: process.env.CLOUDINARY_API_SECRET || "mock_api_secret",
      });

      return {
        success: true,
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
        apiKey: process.env.CLOUDINARY_API_KEY || "mock_api_key",
        folder
      };
    } catch (err: any) {
      console.error("sign-upload error in NestJS:", err);
      throw new InternalServerErrorException("Failed to generate Cloudinary signature");
    }
  }
}
