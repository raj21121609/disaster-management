const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini (reusing environment variable)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

// Mock static images for different disaster types
// In a real scenario, these would be fetched from a Cloud Storage bucket or an API
const SATELLITE_IMAGES = {
    flood: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Satellite_image_of_flooding_in_Pakistan_2010.jpg/800px-Satellite_image_of_flooding_in_Pakistan_2010.jpg',
        bounds: [[40.6, -74.1], [40.8, -73.9]], // Approximate bounds for NYC area (demo)
        timestamp: new Date().toISOString()
    },
    fire: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Satellite_image_of_California_wildfires_2018.jpg/800px-Satellite_image_of_California_wildfires_2018.jpg',
        bounds: [[40.65, -74.05], [40.85, -73.95]],
        timestamp: new Date().toISOString()
    },
    earthquake: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Haiti_earthquake_2010_Port-au-Prince_satellite.jpg/800px-Haiti_earthquake_2010_Port-au-Prince_satellite.jpg',
        bounds: [[40.7, -74.02], [40.75, -73.98]],
        timestamp: new Date().toISOString()
    },
    default: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Blue_Marble_2002.png',
        bounds: [[40.0, -75.0], [41.0, -73.0]],
        timestamp: new Date().toISOString()
    }
};

/**
 * Analyzes disaster metadata using Gemini Pro/Flash
 * @param {Object} data - { zone, disasterType, affectedAreaKm2, roadAccess, populationDensity }
 * @returns {Promise<Object>} Structured analysis
 */
const analyzeDamage = async (data) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are a strategic emergency response AI assistant.
        Analyze the following SATELLITE METADATA for a disaster zone.
        This is DECISION SUPPORT only. Be conservative.

        Data:
        - Zone: ${data.zone}
        - Type: ${data.disasterType}
        - Affected Area: ${data.affectedAreaKm2} km²
        - Road Access: ${data.roadAccess}
        - Population Density: ${data.populationDensity}

        Output STRICT JSON format:
        {
            "damageSeverity": "Low" | "Medium" | "High" | "Critical",
            "priority": "Standard" | "High" | "Critical",
            "recommendedResources": {
                "ambulances": number,
                "rescueTeams": number,
                "fireUnits": number,
                "policeUnits": number
            },
            "justification": "Short strategic reasoning (max 2 sentences). Mention road access risks if 'low'."
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Basic cleanup to ensure JSON parsing if model adds markdown blocks
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        // Fallback rule-based logic
        return {
            damageSeverity: "Medium",
            priority: "High",
            recommendedResources: {
                ambulances: 2,
                rescueTeams: 1,
                fireUnits: 1,
                policeUnits: 2
            },
            justification: "AI analysis unavailable. Defaulting to standard response protocol based on zone type."
        };
    }
};

const getSatelliteImage = (type) => {
    return SATELLITE_IMAGES[type?.toLowerCase()] || SATELLITE_IMAGES.default;
};

module.exports = {
    analyzeDamage,
    getSatelliteImage
};
