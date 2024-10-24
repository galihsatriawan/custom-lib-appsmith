export default {
    /**
     * This module provides functionality to try custom lib.
     * @module JSSimpleFunction
     */

    /**
     * Asynchronously fetches JavaScript content from a URL.
     * @function fetchJsContent
     * @param {string} url - The URL to fetch the JavaScript content from.
     * @returns {Promise<string>} A promise that resolves with the fetched JavaScript content as text.
     * @async
     */
    async fetchJsContent(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch JS content from ${url}`);
        }
        return response.text();
    },
};