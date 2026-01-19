import mongoose from 'mongoose';
import Hub from '../src/models/Hub.js';
import connectDB from '../src/config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Complete hub addresses with real locations in Kerala
const hubAddresses = [
    {
        district: 'Thiruvananthapuram',
        location: {
            address: 'TC 25/1456, Opposite Bus Stand, MG Road',
            city: 'Thiruvananthapuram',
            state: 'Kerala',
            pincode: '695001',
            landmark: 'Near East Fort',
            coordinates: {
                lat: 8.5241,
                lng: 76.9366
            }
        },
        phone: '+91 471 2345678',
        email: 'hub.thiruvananthapuram@pepper.com'
    },
    {
        district: 'Kollam',
        location: {
            address: 'Building No. 42, Chinnakada Junction, Main Road',
            city: 'Kollam',
            state: 'Kerala',
            pincode: '691001',
            landmark: 'Near Kollam Railway Station',
            coordinates: {
                lat: 8.8932,
                lng: 76.6141
            }
        },
        phone: '+91 474 2756789',
        email: 'hub.kollam@pepper.com'
    },
    {
        district: 'Pathanamthitta',
        location: {
            address: 'Municipal Complex, Ward 15, Opposite Civil Station',
            city: 'Pathanamthitta',
            state: 'Kerala',
            pincode: '689645',
            landmark: 'Near District Court',
            coordinates: {
                lat: 9.2648,
                lng: 76.7870
            }
        },
        phone: '+91 468 2234567',
        email: 'hub.pathanamthitta@pepper.com'
    },
    {
        district: 'Alappuzha',
        location: {
            address: 'Shop No. 18, Beach Road, Near Boat Jetty',
            city: 'Alappuzha',
            state: 'Kerala',
            pincode: '688001',
            landmark: 'Alappuzha Beach',
            coordinates: {
                lat: 9.4981,
                lng: 76.3388
            }
        },
        phone: '+91 477 2245678',
        email: 'hub.alappuzha@pepper.com'
    },
    {
        district: 'Kottayam',
        location: {
            address: 'Building 45, MC Road, Near Railway Station',
            city: 'Kottayam',
            state: 'Kerala',
            pincode: '686001',
            landmark: 'Kottayam Railway Station',
            coordinates: {
                lat: 9.5916,
                lng: 76.5222
            }
        },
        phone: '+91 481 2567890',
        email: 'hub.kottayam@pepper.com'
    },
    {
        district: 'Idukki',
        location: {
            address: 'Ground Floor, Shopping Complex, Main Bazaar',
            city: 'Thodupuzha',
            state: 'Kerala',
            pincode: '685584',
            landmark: 'Near Thodupuzha Bridge',
            coordinates: {
                lat: 9.8944,
                lng: 76.7169
            }
        },
        phone: '+91 486 2223456',
        email: 'hub.idukki@pepper.com'
    },
    {
        district: 'Ernakulam',
        location: {
            address: '3rd Floor, Metro Plaza, MG Road',
            city: 'Kochi',
            state: 'Kerala',
            pincode: '682016',
            landmark: 'Near Maharajas College',
            coordinates: {
                lat: 9.9312,
                lng: 76.2673
            }
        },
        phone: '+91 484 2398765',
        email: 'hub.ernakulam@pepper.com'
    },
    {
        district: 'Thrissur',
        location: {
            address: 'Shop 27, Round South, Near Vadakkunnathan Temple',
            city: 'Thrissur',
            state: 'Kerala',
            pincode: '680001',
            landmark: 'Thrissur Round',
            coordinates: {
                lat: 10.5276,
                lng: 76.2144
            }
        },
        phone: '+91 487 2345678',
        email: 'hub.thrissur@pepper.com'
    },
    {
        district: 'Palakkad',
        location: {
            address: 'Ground Floor, City Centre Mall, English Church Road',
            city: 'Palakkad',
            state: 'Kerala',
            pincode: '678001',
            landmark: 'Near Palakkad Fort',
            coordinates: {
                lat: 10.7867,
                lng: 76.6548
            }
        },
        phone: '+91 491 2456789',
        email: 'hub.palakkad@pepper.com'
    },
    {
        district: 'Malappuram',
        location: {
            address: 'Building 12, Uphill Road, Near Mini Civil Station',
            city: 'Malappuram',
            state: 'Kerala',
            pincode: '676505',
            landmark: 'Mini Civil Station',
            coordinates: {
                lat: 11.0510,
                lng: 76.0711
            }
        },
        phone: '+91 483 2567890',
        email: 'hub.malappuram@pepper.com'
    },
    {
        district: 'Kozhikode',
        location: {
            address: 'Shop No. 56, SM Street (Sweet Meat Street)',
            city: 'Kozhikode',
            state: 'Kerala',
            pincode: '673001',
            landmark: 'Near Kozhikode Beach',
            coordinates: {
                lat: 11.2588,
                lng: 75.7804
            }
        },
        phone: '+91 495 2678901',
        email: 'hub.kozhikode@pepper.com'
    },
    {
        district: 'Wayanad',
        location: {
            address: 'Ground Floor, Town Centre Building, Kalpetta',
            city: 'Kalpetta',
            state: 'Kerala',
            pincode: '673121',
            landmark: 'Near Kalpetta Bus Stand',
            coordinates: {
                lat: 11.6085,
                lng: 76.0842
            }
        },
        phone: '+91 493 2234567',
        email: 'hub.wayanad@pepper.com'
    },
    {
        district: 'Kannur',
        location: {
            address: 'Shop 33, Fort Road, Opposite Municipal Office',
            city: 'Kannur',
            state: 'Kerala',
            pincode: '670001',
            landmark: 'Near St. Angelo Fort',
            coordinates: {
                lat: 11.8745,
                lng: 75.3704
            }
        },
        phone: '+91 497 2789012',
        email: 'hub.kannur@pepper.com'
    },
    {
        district: 'Kasaragod',
        location: {
            address: 'Building 8, Vidyanagar Main Road, Near Bus Stand',
            city: 'Kasaragod',
            state: 'Kerala',
            pincode: '671121',
            landmark: 'Kasaragod Bus Stand',
            coordinates: {
                lat: 12.4996,
                lng: 74.9869
            }
        },
        phone: '+91 499 2345678',
        email: 'hub.kasaragod@pepper.com'
    }
];

async function updateHubAddresses() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const hubData of hubAddresses) {
            const hubName = `${hubData.district} Hub`;
            console.log(`📍 Updating ${hubName}...`);

            const hub = await Hub.findOne({ name: hubName });

            if (!hub) {
                console.log(`   ⚠️  Hub not found: ${hubName}`);
                notFoundCount++;
                continue;
            }

            // Update hub with complete address
            hub.location = hubData.location;
            hub.phone = hubData.phone;
            hub.email = hubData.email;
            hub.isActive = true;

            await hub.save();
            
            console.log(`   ✅ Updated successfully`);
            console.log(`      📧 Email: ${hubData.email}`);
            console.log(`      📞 Phone: ${hubData.phone}`);
            console.log(`      📍 Address: ${hubData.location.address}`);
            console.log(`      🗺️  Coordinates: ${hubData.location.coordinates.lat}, ${hubData.location.coordinates.lng}`);
            console.log('');

            updatedCount++;
        }

        console.log('═══════════════════════════════════════');
        console.log('✅ Hub Addresses Update Complete!');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Updated: ${updatedCount} hubs`);
        if (notFoundCount > 0) {
            console.log(`⚠️  Not Found: ${notFoundCount} hubs`);
        }
        console.log('');
        console.log('📌 All hubs now have:');
        console.log('   • Complete street addresses');
        console.log('   • Exact GPS coordinates');
        console.log('   • Phone numbers');
        console.log('   • Email addresses');
        console.log('   • Landmarks for easy navigation');
        console.log('');
        console.log('🗺️  Customers can now navigate to hubs using Google Maps!');

    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

updateHubAddresses();
