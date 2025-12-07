/**
 * Images API Module
 * 이미지 업로드 관련 API 호출을 담당합니다.
 * Presigned URL 방식 사용
 */

import { apiRequest } from "./base.js";

/**
 * 이미지 파일 최대 크기 (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * 이미지 파일 유효성 검사
 * @param {File} file - 검사할 파일
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateImageFile(file) {
    // 파일 존재 여부
    if (!file) {
        return { valid: false, error: '파일을 선택해주세요.' };
    }

    // 파일 타입 검사 (이미지만 허용)
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: '이미지 파일만 업로드 가능합니다.' };
    }

    // 파일 크기 검사 (5MB 제한)
    if (file.size > MAX_IMAGE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        return { valid: false, error: `파일 크기가 너무 큽니다. (${sizeMB}MB / 최대 5MB)` };
    }

    return { valid: true, error: null };
}

/**
 * Images API 객체
 * 프로필 이미지 및 게시물 이미지 업로드 API를 제공합니다.
 */
export const ImagesAPI = {
    /**
     * Presigned URL 요청 (프로필 이미지)
     * @param {string} originalFilename - 업로드할 파일의 원본 파일명
     * @returns {Promise<{data: {presignedUrl: string, key: string, imageId: number}, error: any, status: number}>}
     */
    getPresignedUrlProfile: (originalFilename) => {
        return apiRequest('/images/profile/presigned-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ originalFilename }),
        });
    },

    /**
     * Presigned URL 요청 (게시물 이미지)
     * @param {string} originalFilename - 업로드할 파일의 원본 파일명
     * @returns {Promise<{data: {presignedUrl: string, key: string, imageId: number}, error: any, status: number}>}
     */
    getPresignedUrlPost: (originalFilename) => {
        return apiRequest('/images/post/presigned-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ originalFilename }),
        });
    },

    /**
     * S3에 이미지 직접 업로드
     * @param {string} presignedUrl - Presigned URL
     * @param {File} file - 업로드할 파일
     * @returns {Promise<Response>}
     */
    uploadToS3: async (presignedUrl, file) => {
        return fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });
    },

    /**
     * 프로필 이미지 업로드 (전체 플로우)
     * @param {File} file - 업로드할 이미지 파일
     * @returns {Promise<{imageId: number|null, error: string|null}>}
     */
    uploadProfileImage: async (file) => {
        try {
            // 1. 파일 유효성 검사
            const validation = validateImageFile(file);
            if (!validation.valid) {
                return { imageId: null, error: validation.error };
            }

            // 2. Presigned URL 요청
            const presignedResponse = await ImagesAPI.getPresignedUrlProfile(file.name);

            if (presignedResponse.error || !presignedResponse.data) {
                return { imageId: null, error: '이미지 업로드 준비에 실패했습니다.' };
            }

            const { presignedUrl, imageId } = presignedResponse.data;

            // 3. S3에 직접 업로드
            const uploadResponse = await ImagesAPI.uploadToS3(presignedUrl, file);

            if (!uploadResponse.ok) {
                return { imageId: null, error: '이미지 업로드에 실패했습니다.' };
            }

            // 4. 성공 - imageId 반환
            return { imageId, error: null };

        } catch (error) {
            console.error('Image upload error:', error);
            return { imageId: null, error: '이미지 업로드 중 오류가 발생했습니다.' };
        }
    },

    /**
     * 게시물 이미지 업로드 (전체 플로우)
     * @param {File} file - 업로드할 이미지 파일
     * @returns {Promise<{imageId: number|null, error: string|null}>}
     */
    uploadPostImage: async (file) => {
        try {
            // 1. 파일 유효성 검사
            const validation = validateImageFile(file);
            if (!validation.valid) {
                return { imageId: null, error: validation.error };
            }

            // 2. Presigned URL 요청
            const presignedResponse = await ImagesAPI.getPresignedUrlPost(file.name);

            if (presignedResponse.error || !presignedResponse.data) {
                return { imageId: null, error: '이미지 업로드 준비에 실패했습니다.' };
            }

            const { presignedUrl, imageId } = presignedResponse.data;

            // 3. S3에 직접 업로드
            const uploadResponse = await ImagesAPI.uploadToS3(presignedUrl, file);

            if (!uploadResponse.ok) {
                return { imageId: null, error: '이미지 업로드에 실패했습니다.' };
            }

            // 4. 성공 - imageId 반환
            return { imageId, error: null };

        } catch (error) {
            console.error('Image upload error:', error);
            return { imageId: null, error: '이미지 업로드 중 오류가 발생했습니다.' };
        }
    },

    /**
     * 다중 게시물 이미지 업로드 Presigned URLs 요청
     * @param {File[]} files - 업로드할 파일 배열
     * @returns {Promise<{data: Array<{presignedUrl: string, key: string, imageId: number}>, error: any, status: number}>}
     */
    getMultiplePresignedUrlsPost: (files) => {
        const presignedUrlRequests = files.map(file => ({
            originalFilename: file.name
        }));

        return apiRequest('/images/post/presigned-urls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(presignedUrlRequests),
        });
    },

    /**
     * 다중 게시물 이미지 업로드 (전체 플로우)
     * @param {File[]} files - 업로드할 이미지 파일 배열
     * @returns {Promise<{imageIds: number[], errors: Array<{file: string, error: string}>}>}
     */
    uploadMultiplePostImages: async (files) => {
        try {
            // 1. 파일 유효성 검사
            const validFiles = [];
            const errors = [];

            for (const file of files) {
                const validation = validateImageFile(file);
                if (!validation.valid) {
                    errors.push({ file: file.name, error: validation.error });
                } else {
                    validFiles.push(file);
                }
            }

            if (validFiles.length === 0) {
                return { imageIds: [], errors };
            }

            // 2. Presigned URLs 일괄 요청
            const presignedResponse = await ImagesAPI.getMultiplePresignedUrlsPost(validFiles);

            if (presignedResponse.error || !presignedResponse.data) {
                return {
                    imageIds: [],
                    errors: [
                        ...errors,
                        ...validFiles.map(file => ({ file: file.name, error: '이미지 업로드 준비에 실패했습니다.' }))
                    ]
                };
            }

            const presignedData = presignedResponse.data;

            // 3. 각 파일을 S3에 병렬 업로드
            const uploadPromises = validFiles.map(async (file, index) => {
                try {
                    const { presignedUrl, imageId } = presignedData[index];

                    const uploadResponse = await ImagesAPI.uploadToS3(presignedUrl, file);

                    if (!uploadResponse.ok) {
                        errors.push({ file: file.name, error: '이미지 업로드에 실패했습니다.' });
                        return null;
                    }

                    return imageId;
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    errors.push({ file: file.name, error: '이미지 업로드 중 오류가 발생했습니다.' });
                    return null;
                }
            });

            const uploadResults = await Promise.all(uploadPromises);

            // 4. 성공한 imageId만 필터링
            const imageIds = uploadResults.filter(id => id !== null);

            return { imageIds, errors };

        } catch (error) {
            console.error('Multiple image upload error:', error);
            return {
                imageIds: [],
                errors: files.map(file => ({ file: file.name, error: '이미지 업로드 중 오류가 발생했습니다.' }))
            };
        }
    },
};
