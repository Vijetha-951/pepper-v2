import mongoose from 'mongoose';
import { config } from 'dotenv';
import { generateRoute } from '../services/routeGenerationService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("--- Test 1: Kottayam -> Kannur ---");
        const route1 = await generateRoute('Kannur');
        console.log("Route:", route1.map(h => `${h.district} (${h.type})`).join(' -> '));

        console.log("\n--- Test 2: Kottayam -> Ernakulam ---");
        const route2 = await generateRoute('Ernakulam');
        console.log("Route:", route2.map(h => `${h.district} (${h.type})`).join(' -> '));

        console.log("\n--- Test 3: Kottayam -> Pathanamthitta ---");
        const route3 = await generateRoute('Pathanamthitta');
        console.log("Route:", route3.map(h => `${h.district} (${h.type})`).join(' -> '));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verify();
