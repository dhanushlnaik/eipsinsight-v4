import { prisma } from '../src/lib/prisma';

async function seedUpgrades() {
  const upgrades = [
    {
      slug: 'frontier',
      name: 'Frontier',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'homestead',
      name: 'Homestead',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'dao-fork',
      name: 'DAO Fork',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'tangerine-whistle',
      name: 'Tangerine Whistle',
      meta_eip: 150,
      repo: null,
      file_path: null,
    },
    {
      slug: 'spurious-dragon',
      name: 'Spurious Dragon',
      meta_eip: 155,
      repo: null,
      file_path: null,
    },
    {
      slug: 'byzantium',
      name: 'Byzantium',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'constantinople',
      name: 'Constantinople',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'istanbul',
      name: 'Istanbul',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'berlin',
      name: 'Berlin',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'london',
      name: 'London',
      meta_eip: 1559,
      repo: null,
      file_path: null,
    },
    // Combined EL/CL upgrades use the meta name, matching the scheduler's convention
    // for Pectra ("Prague/Electra (Pectra)") and Fusaka ("Fulu/Osaka (Fusaka)").
    {
      slug: 'paris',
      name: 'Paris/Bellatrix (The Merge)',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'shanghai',
      name: 'Shanghai/Capella (Shapella)',
      meta_eip: null,
      repo: null,
      file_path: null,
    },
    {
      slug: 'cancun',
      name: 'Cancun/Deneb (Dencun)',
      meta_eip: 4844,
      repo: null,
      file_path: null,
    },
  ];

  for (const upgrade of upgrades) {
    const existingUpgrade = await prisma.upgrades.findUnique({
      where: { slug: upgrade.slug },
    });

    if (!existingUpgrade) {
      await prisma.upgrades.create({
        data: upgrade,
      });
      console.log(`Created upgrade: ${upgrade.name} (${upgrade.slug})`);
    } else {
      console.log(`Upgrade already exists: ${upgrade.name} (${upgrade.slug})`);
    }
  }

  console.log('✅ Upgrades seeded successfully');
}

export { seedUpgrades };
