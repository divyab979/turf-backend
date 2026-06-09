import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Avoid double initialization if it exists
    if (admin.apps.length > 0) {
      this.firebaseApp = admin.apps[0]!;
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        'WARNING: Firebase service account variables are not fully configured. Google login may fail.',
      );
      return;
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) {
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.apps[0]!;
      } else {
        throw new Error('Firebase Admin SDK is not initialized.');
      }
    }
    return admin.auth(this.firebaseApp).verifyIdToken(idToken);
  }
}
