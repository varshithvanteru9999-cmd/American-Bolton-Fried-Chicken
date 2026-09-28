// Seeds PostgreSQL from src/data/menuData.js (the Phase 1 source of truth).
// Run with: npx prisma db seed
import { PrismaClient } from '@prisma/client';
import { categories, menuItems, recommendedItems } from '../src/data/menuData.js';

const prisma = new PrismaClient();

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  // Wipe in FK-safe order (children before parents) so the seed is re-runnable
  await prisma.orderItemAddon.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.addonOption.deleteMany();
  await prisma.addonGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  const featuredIds = new Set(recommendedItems.map((r) => r.id));
  const usedSlugs = new Set();

  for (const [catIndex, name] of categories.entries()) {
    const category = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        displayOrder: catIndex,
      },
    });

    const items = menuItems.filter((i) => i.category === name);

    for (const [itemIndex, item] of items.entries()) {
      let slug = slugify(item.title);
      if (usedSlugs.has(slug)) slug = `${slug}-${item.id}`;
      usedSlugs.add(slug);

      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: item.title,
          slug,
          description: item.desc || null,
          basePrice: item.price,
          imageUrl: item.image || null,
          isFeatured: featuredIds.has(item.id),
          displayOrder: itemIndex,
          addonGroups:
            item.addons && item.addons.length > 0
              ? {
                  create: [
                    {
                      name: 'Extras',
                      selectionType: 'MULTIPLE',
                      displayOrder: 0,
                      options: {
                        create: item.addons.map((addon, j) => ({
                          name: addon.name,
                          priceModifier: addon.price,
                          displayOrder: j,
                        })),
                      },
                    },
                  ],
                }
              : undefined,
        },
      });
    }
  }

  // The live site's standing offer: 20% off orders over 20, capped at 25 savings
  await prisma.promoCode.deleteMany();
  await prisma.promoCode.create({
    data: {
      code: 'GET20',
      description: '20% off on orders over 20.00 (up to 25.00 savings)',
      type: 'PERCENTAGE',
      value: 20,
      minOrderValue: 20,
      maxDiscount: 25,
      validFrom: new Date(),
    },
  });

  console.log('Seed complete:', {
    categories: await prisma.category.count(),
    menuItems: await prisma.menuItem.count(),
    featured: await prisma.menuItem.count({ where: { isFeatured: true } }),
    addonGroups: await prisma.addonGroup.count(),
    addonOptions: await prisma.addonOption.count(),
    promoCodes: await prisma.promoCode.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
