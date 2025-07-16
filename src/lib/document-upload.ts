import { supabase } from './supabase';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Document Upload] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Document Upload Error] ${message}`, error ? error : '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[Document Upload Debug] ${message}`, data ? data : '');
  }
};

interface UploadResult {
  success: boolean;
  referralId?: string;
  error?: string;
}

export async function handleDocumentUpload(
  file: File,
  isClientsPage: boolean,
  clientId?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    log.info('Starting document upload process');
    
    // Validate input parameters
    if (!file) {
      log.error('No file provided');
      return {
        success: false,
        error: 'No file provided'
      };
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      log.error('Invalid file type:', file.type);
      return {
        success: false,
        error: 'Invalid file type. Please upload a PDF document.'
      };
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      log.error('Authentication error:', userError);
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    log.info('Authenticated user:', { id: user.id });

    // Generate a unique filename with user ID prefix for proper storage bucket policy
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `${user.id}/${timestamp}-${randomString}.pdf`;
    log.debug('Generated filename:', fileName);

    // Create upload options with progress tracking
    const options = {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: false,
      onUploadProgress: (progress: { percent?: number }) => {
        if (progress.percent !== undefined) {
          log.debug('Upload progress:', progress.percent);
          onProgress?.(Math.round(progress.percent));
        }
      }
    };

    // Upload file to Supabase storage
    log.info('Starting file upload to storage');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('referrals')
      .upload(fileName, file, options);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      log.error('Storage upload failed:', uploadError);
      return {
        success: false,
        error: 'Failed to upload document. Please try again.'
      };
    }

    if (!uploadData?.path) {
      log.error('Upload completed but no file path returned');
      return {
        success: false,
        error: 'Upload completed but no file path returned'
      };
    }
    log.info('File uploaded successfully:', { path: uploadData.path });

    // Create referral record in database
    log.info('Creating referral record in database');
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .insert({
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending'
      })
      .select('id')
      .single();

    if (referralError) {
      // If database insert fails, delete the uploaded file
      log.error('Database insert failed, cleaning up storage:', referralError);
      await supabase.storage
        .from('referrals')
        .remove([fileName]);

      console.error('Referral creation error:', referralError);
      return {
        success: false,
        error: 'Failed to create referral record. Please try again.'
      };
    }
    log.info('Referral record created:', { id: referralData.id });

    // Send webhook for additional processing
    const webhookPayload = {
      id: referralData.id,
      clientId: isClientsPage ? "-1" : clientId // Use "-1" for uploads from Clients page
    };
    log.info('Calling webhook with payload:', webhookPayload);

    const webhookResponse = await fetch('https://hook.us1.make.com/7ohrm3qksjewxafrmhlu4ye0mtmvrpv8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      log.error('Webhook failed:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText
      });
      // If webhook fails, mark the referral as failed but don't delete it
      await supabase
        .from('referrals')
        .update({ status: 'failed' })
        .eq('id', referralData.id);

      return {
        success: false,
        error: 'Failed to process document. Please try again.'
      };
    }
    log.info('Webhook completed successfully');

    // Set progress to 100% on success
    onProgress?.(100);
    log.info('Upload process completed successfully');

    return {
      success: true,
      referralId: referralData.id
    };

  } catch (error) {
    console.error('Document upload error:', error);
    log.error('Unexpected error during upload:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}
