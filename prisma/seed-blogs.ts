import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const AYUSH_AVATAR =
  'https://res.cloudinary.com/dmfefy0gx/image/upload/v1782110335/pfps/uo8rivjbzvpyotzu1sv7.jpg';

// Known user IDs from the database
const KNOWN_USERS = {
  dhanush: 'L1w2HBMsPHazArv6f1HcDseDrAMlAXmt',
  yash: 'XiepN8m9OUU3PmVzErySz2ezUSsEkH8L',
  pooja: 'zzQAjfk8vx6IxWapvA0H0cC5m9zU9QMr',
  avarchTeam: 'roKkWc3NLq3Xnhnz45ECDbDGtZpteklD',
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function resolveAuthorId(
  authorName: string,
  authorIdMap: Record<string, string>
): string {
  const name = authorName.trim().toLowerCase();
  if (name.includes('dhanush')) return KNOWN_USERS.dhanush;
  if (name.includes('yash')) return KNOWN_USERS.yash;
  if (name.includes('pooja')) return KNOWN_USERS.pooja;
  if (name.includes('ayush')) return authorIdMap['ayush'];
  if (name.includes('avarch')) return KNOWN_USERS.avarchTeam;
  // fallback to Yash (site operator)
  return KNOWN_USERS.yash;
}

async function main() {
  console.log('🌱 Seeding blogs from markdown files...\n');

  // 1. Ensure Ayush Shetty exists
  console.log('👤 Ensuring Ayush Shetty user exists...');
  let ayush = await prisma.user.findFirst({
    where: { email: 'ayush.shetty.demo@eipsinsight.com' },
  });
  if (!ayush) {
    ayush = await prisma.user.create({
      data: {
        email: 'ayush.shetty.demo@eipsinsight.com',
        name: 'Ayush Shetty',
        emailVerified: false,
        image: AYUSH_AVATAR,
        avatarUrl: AYUSH_AVATAR,
        role: 'user',
      },
    });
    console.log(`   ✅ Created Ayush: ${ayush.id}`);
  } else {
    await prisma.user.update({
      where: { id: ayush.id },
      data: { name: 'Ayush Shetty', image: AYUSH_AVATAR, avatarUrl: AYUSH_AVATAR },
    });
    console.log(`   ⏭️  Ayush already exists: ${ayush.id}`);
  }

  // 2. Update Avarch Team user name
  console.log('👥 Updating Avarch Team user name...');
  await prisma.user.update({
    where: { id: KNOWN_USERS.avarchTeam },
    data: { name: 'Avarch Team' },
  });
  console.log(`   ✅ Avarch Team: ${KNOWN_USERS.avarchTeam}`);

  // 3. Create blog editor profiles
  console.log('📝 Creating blog editor profiles...');
  await prisma.blog_editor_profile.upsert({
    where: { user_id: ayush.id },
    create: {
      user_id: ayush.id,
      x: 'https://x.com/_AyushShetty_',
      linkedin: 'https://www.linkedin.com/in/ayush-shetty-88aa43247/',
      bio: 'Intern at Avarch | Web3 | Software Engineer Aspirant | Senior year student at NMAMIT | Information Science Engineering',
    },
    update: {
      x: 'https://x.com/_AyushShetty_',
      linkedin: 'https://www.linkedin.com/in/ayush-shetty-88aa43247/',
      bio: 'Intern at Avarch | Web3 | Software Engineer Aspirant | Senior year student at NMAMIT | Information Science Engineering',
    },
  });
  console.log(`   ✅ Editor profile for Ayush`);

  const authorIdMap: Record<string, string> = {
    ayush: ayush.id,
  };

  // 4. Ensure categories exist
  console.log('\n📂 Ensuring blog categories exist...');
  const categoryDefs = [
    {
      slug: 'ethereum-upgrades',
      name: 'Ethereum Upgrades',
      description: 'Ethereum protocol upgrade news and analysis',
    },
    {
      slug: 'ethereum-governance',
      name: 'Ethereum Governance',
      description: 'EIP process, governance decisions and discussions',
    },
    {
      slug: 'career',
      name: 'Career',
      description: 'Job openings and team announcements',
    },
    {
      slug: 'tools',
      name: 'Tools',
      description: 'Developer tools and platform features',
    },
  ];

  const categoryIdMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const existing = await prisma.blog_category.findUnique({
      where: { slug: cat.slug },
    });
    if (existing) {
      categoryIdMap[cat.slug] = existing.id;
      categoryIdMap[cat.name.toLowerCase()] = existing.id;
      console.log(`   ⏭️  Category exists: ${cat.name}`);
    } else {
      const created = await prisma.blog_category.create({ data: cat });
      categoryIdMap[cat.slug] = created.id;
      categoryIdMap[cat.name.toLowerCase()] = created.id;
      console.log(`   ✅ Created category: ${cat.name}`);
    }
  }

  // Also pull existing categories
  const allCats = await prisma.blog_category.findMany();
  for (const cat of allCats) {
    categoryIdMap[cat.slug] = cat.id;
    categoryIdMap[cat.name.toLowerCase()] = cat.id;
  }

  // 5. Read all markdown blog files
  const blogsDir = path.join(__dirname, '../src/blogs');
  const files = fs
    .readdirSync(blogsDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  console.log(`\n📚 Found ${files.length} blog files\n`);

  // 6. Get existing slugs to skip duplicates
  const existingBlogs = await prisma.blog.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existingBlogs.map((b) => b.slug));
  console.log(
    `   Existing blog slugs: ${[...existingSlugs].join(', ')}\n`
  );

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(blogsDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: fm, content } = matter(raw);

    // Derive slug: frontmatter slug > filename without extension (lowercased)
    const slug =
      fm.slug ||
      path
        .basename(file, '.md')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-');

    if (existingSlugs.has(slug)) {
      console.log(`   ⏭️  Skipping (already exists): ${slug}`);
      skipped++;
      continue;
    }

    // Resolve author
    const authorName: string = fm.author || 'Avarch Team';
    const authorId = resolveAuthorId(authorName, authorIdMap);

    // Resolve category
    let categoryId: string | undefined;
    if (fm.category) {
      const catKey = fm.category.toLowerCase().trim();
      categoryId =
        categoryIdMap[catKey] ||
        categoryIdMap[slugify(catKey)] ||
        categoryIdMap['ethereum-upgrades'];
    }

    // Compute reading time
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes =
      fm.readTime || Math.max(1, Math.round(wordCount / 200));

    // Parse date
    let createdAt: Date;
    try {
      createdAt = fm.date ? new Date(fm.date) : new Date();
    } catch {
      createdAt = new Date();
    }

    // Build tags
    const tags: string[] = Array.isArray(fm.tags) ? fm.tags : [];

    // Trim leading heading if it duplicates the title
    const cleanContent = content.trim();

    try {
      const blog = await prisma.blog.create({
        data: {
          slug,
          title: fm.title || file.replace('.md', ''),
          excerpt: fm.excerpt || fm.summaryPoints?.[0] || null,
          content: cleanContent,
          coverImage: fm.image || null,
          published: true,
          authorId,
          categoryId: categoryId || null,
          readingTimeMinutes,
          tags,
          featured: fm.featured ?? false,
          createdAt,
          updatedAt: createdAt,
        },
      });
      console.log(`   ✅ Created: ${blog.slug} (author: ${authorName})`);
      created++;
      existingSlugs.add(slug);
    } catch (err) {
      console.error(`   ❌ Failed: ${slug} — ${err}`);
    }
  }

  console.log(
    `\n🎉 Done! Created: ${created}, Skipped: ${skipped}, Total: ${files.length}`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
