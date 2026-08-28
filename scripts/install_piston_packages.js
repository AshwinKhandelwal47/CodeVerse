import axios from 'axios';

async function installPistonPackages() {
    try {
        console.log("Fetching available packages...");
        const response = await axios.get('http://127.0.0.1:2000/api/v2/packages');
        const packages = response.data;
        
        const targets = ['python', 'node', 'c++', 'java', 'gcc']; // Sometimes cpp is gcc
        const toInstall = [];

        packages.forEach(pkg => {
            if (targets.includes(pkg.language) && !pkg.installed) {
                // we install the highest version
                // for simplicity, just grab the first one that matches
                if(!toInstall.find(t => t.language === pkg.language)) {
                    toInstall.push({ language: pkg.language, version: pkg.language_version });
                }
            }
        });

        console.log("Installing packages:", toInstall);

        for (const pkg of toInstall) {
            console.log(`Installing ${pkg.language} ${pkg.version}...`);
            await axios.post('http://127.0.0.1:2000/api/v2/packages', pkg);
            console.log(`Successfully installed ${pkg.language} ${pkg.version}`);
        }
        console.log("All done.");
    } catch (err) {
        console.error(err);
    }
}

installPistonPackages();
