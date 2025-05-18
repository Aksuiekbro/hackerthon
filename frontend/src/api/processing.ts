import axios from 'axios';
import { WizardFormData } from '../types/wizard'; // Adjusted path

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ProcessApiResponse {
    job_id: string;
    output_base_directory: string;
    generated_files: string[];
    stdout?: string; // Optional, for debugging
}

interface VideoSource {
    video_url?: string;
    server_file_path?: string;
}

export const callProcessMotionAPI = async (source: VideoSource): Promise<ProcessApiResponse> => {
    // Backend expects one of video_url or server_file_path in the body
    const response = await axios.post(`${API_BASE_URL}/process/motion/`, source);
    return response.data;
};

export const callProcessTextAPI = async (
    source: VideoSource, // Changed from individual params
    numClips: number,
    maxDurationYt: number,
    targetFormat: 'youtube' | 'instagram' | 'both'
): Promise<ProcessApiResponse> => {
    const payload = {
        ...source, // Spreads video_url or server_file_path
        num_clips: numClips,
        max_duration_yt: maxDurationYt,
        target_format: targetFormat,
    };
    const response = await axios.post(`${API_BASE_URL}/process/text/`, payload);
    return response.data;
};
export interface FileUploadResponse {
    message: string;
    server_file_path: string;
}

export const uploadVideoFileAPI = async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/upload/video/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};