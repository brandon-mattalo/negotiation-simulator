import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBotNameToExistingConfigs() {
  try {
    const configs = await prisma.configuration.findMany();

    for (const config of configs) {
      const personality = JSON.parse(config.personality as string);

      // Only update if name is not already set
      if (!personality.name) {
        personality.name = 'AI Partner';

        await prisma.configuration.update({
          where: { id: config.id },
          data: {
            personality: JSON.stringify(personality),
          },
        });

        console.log(`Updated configuration ${config.id} with default bot name`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBotNameToExistingConfigs();
