import axios from 'axios';
import { SEVEN_DRAGON_CONFIG, ENDPOINTS } from '../config/sevenDragon';

class SevenDragonService {
    constructor() {
        this.api = axios.create({
            baseURL: SEVEN_DRAGON_CONFIG.API_URL,
            headers: {
                'Authorization': `Bearer ${SEVEN_DRAGON_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // Update landing page content
    async updateContent(section, content) {
        try {
            const response = await this.api.post(ENDPOINTS.UPDATE_CONTENT, {
                section,
                content
            });
            return response.data;
        } catch (error) {
            console.error('Error updating content:', error);
            throw error;
        }
    }

    // Update promotion
    async updatePromotion(promotionData) {
        try {
            const response = await this.api.post(ENDPOINTS.UPDATE_PROMOTION, promotionData);
            return response.data;
        } catch (error) {
            console.error('Error updating promotion:', error);
            throw error;
        }
    }

    // Update game
    async updateGame(gameData) {
        try {
            const response = await this.api.post(ENDPOINTS.UPDATE_GAME, gameData);
            return response.data;
        } catch (error) {
            console.error('Error updating game:', error);
            throw error;
        }
    }

    // Trigger deployment
    async triggerDeploy() {
        try {
            // First update GitHub repository
            await this.updateGitHub();
            
            // Then trigger Render deployment
            const response = await this.api.post(ENDPOINTS.DEPLOY);
            return response.data;
        } catch (error) {
            console.error('Error triggering deployment:', error);
            throw error;
        }
    }

    // Update GitHub repository
    async updateGitHub() {
        try {
            const octokit = new Octokit({
                auth: SEVEN_DRAGON_CONFIG.GITHUB_TOKEN
            });

            // Get the latest commit
            const { data: ref } = await octokit.git.getRef({
                owner: SEVEN_DRAGON_CONFIG.REPO_OWNER,
                repo: SEVEN_DRAGON_CONFIG.REPO_NAME,
                ref: `heads/${SEVEN_DRAGON_CONFIG.BRANCH}`
            });

            // Create a new commit
            const { data: commit } = await octokit.git.createCommit({
                owner: SEVEN_DRAGON_CONFIG.REPO_OWNER,
                repo: SEVEN_DRAGON_CONFIG.REPO_NAME,
                message: 'Update content via 18K Chat Admin',
                tree: ref.object.sha,
                parents: [ref.object.sha]
            });

            // Update the reference
            await octokit.git.updateRef({
                owner: SEVEN_DRAGON_CONFIG.REPO_OWNER,
                repo: SEVEN_DRAGON_CONFIG.REPO_NAME,
                ref: `heads/${SEVEN_DRAGON_CONFIG.BRANCH}`,
                sha: commit.sha
            });

            return commit;
        } catch (error) {
            console.error('Error updating GitHub:', error);
            throw error;
        }
    }
}

export const sevenDragonService = new SevenDragonService();
