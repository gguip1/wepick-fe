/**
 * Users API Module
 * 사용자 관련 API 호출을 담당합니다.
 */

import { apiRequest } from './base.js';

/**
 * Users API 객체
 * 인증, 회원가입, 프로필 관리 등 사용자 관련 API를 제공합니다.
 */
export const UsersAPI = {
    /**
     * 로그인
     * @param {Object} data - 로그인 데이터
     * @param {string} data.email - 이메일
     * @param {string} data.password - 비밀번호
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    signIn: (data) => 
        apiRequest('/auth', {
            method: 'POST',
            body: JSON.stringify({ 
                email: data.email, 
                password: data.password 
            }),
            skipAuthRedirect: true, // 로그인 실패 시 리다이렉트 방지
        }),
    /**
     * 회원가입
     * @param {Object} data - 회원가입 데이터
     * @param {string} data.email - 이메일
     * @param {string} data.password - 비밀번호
     * @param {string} data.password2 - 비밀번호 확인
     * @param {string} data.nickname - 닉네임
     * @param {number|null} [data.profileImageId] - 프로필 이미지 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    signUp: (data) =>
        apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({ 
                email: data.email, 
                password: data.password, 
                password2: data.password2, 
                nickname: data.nickname, 
                profileImageId: data.profileImageId ?? null 
            }),
            skipAuthRedirect: true, // 회원가입 실패 시 리다이렉트 방지
        }),
    /**
     * 로그아웃
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    signOut: () => 
        apiRequest('/auth', { 
            method: 'DELETE' 
        }),
    /**
     * 현재 사용자 정보 조회
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getCurrent: () => 
        apiRequest('/users/me', { 
            method: 'GET' 
        }),
    /**
     * 특정 사용자 정보 조회
     * @param {number} userId - 사용자 ID
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    getById: (userId) => 
        apiRequest(`/users/${userId}`, { 
            method: 'GET' 
        }),
    /**
     * 프로필 이미지 변경
     * @param {Object} data - 프로필 이미지 데이터
     * @param {number|null} data.profileImageId - 프로필 이미지 ID (null이면 이미지 제거)
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    updateProfileImage: (data) =>
        apiRequest('/users/me/profile-image', {
            method: 'PATCH',
            body: JSON.stringify({
                profileImageId: data.profileImageId
            }),
        }),

    /**
     * 닉네임 변경
     * @param {Object} data - 닉네임 데이터
     * @param {string} data.nickname - 새 닉네임
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    updateNickname: (data) =>
        apiRequest('/users/me/nickname', {
            method: 'PATCH',
            body: JSON.stringify({
                nickname: data.nickname
            }),
        }),
    /**
     * 비밀번호 변경
     * @param {Object} data - 비밀번호 데이터
     * @param {string} data.oldPassword - 현재 비밀번호
     * @param {string} data.newPassword - 새 비밀번호
     * @param {string} data.newPassword2 - 새 비밀번호 확인
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    updatePassword: (data) =>
        apiRequest('/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword,
                newPassword2: data.newPassword2
            }),
        }),
    /**
     * 회원 탈퇴
     * @returns {Promise<{data: any, error: any, status: number}>}
     */
    deleteCurrent: () => 
        apiRequest('/users/me', {
            method: 'DELETE',
        }),
    checkEmailExists: (email) => 
        apiRequest('/users/check-email', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
    checkNicknameExists: (nickname) =>
        apiRequest('/users/check-nickname', {
            method: 'POST',
            body: JSON.stringify({ nickname }),
        }), 
}