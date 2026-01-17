import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface RecordingResult {
  uri: string;
  duration: number;
}

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      this.recording = recording;
      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult | null> {
    try {
      if (!this.recording) {
        return null;
      }

      const status = await this.recording.getStatusAsync();
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      this.isRecording = false;
      this.recording = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      if (!uri) {
        return null;
      }

      return {
        uri,
        duration: status.durationMillis || 0,
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isRecording = false;
      this.recording = null;

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
        });
      } catch (resetError) {
        console.error('Failed to reset audio mode:', resetError);
      }

      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      this.recording = null;
      this.isRecording = false;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export async function transcribeAudio(audioUri: string, accessToken?: string | null): Promise<string> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    console.log('TRANSCRIBE USING TOKEN', accessToken?.slice(-8));

    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    let audioBlob: Blob;
    let filename: string;

    if (Platform.OS === 'web') {
      const response = await fetch(audioUri);
      audioBlob = await response.blob();
      filename = 'recording.webm';
    } else {
      const response = await fetch(audioUri);
      const arrayBuffer = await response.arrayBuffer();
      audioBlob = new Blob([arrayBuffer], { type: 'audio/m4a' });
      filename = 'recording.m4a';
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, filename);

    const apiUrl = `${supabaseUrl}/functions/v1/transcribeAudio`;

    const transcriptionResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to transcribe audio');
    }

    const result = await transcriptionResponse.json();
    return result.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}
