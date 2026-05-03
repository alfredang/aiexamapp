import { PrismaClient, QStatus, QType, Role } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe!2026';
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: await argon2.hash(adminPassword),
      role: Role.ADMIN,
      emailVerified: new Date()
    }
  });

  const aws = await db.vendor.upsert({
    where: { slug: 'aws' },
    update: {},
    create: { slug: 'aws', name: 'Amazon Web Services', description: 'Cloud certifications from AWS.' }
  });
  const ms = await db.vendor.upsert({
    where: { slug: 'microsoft' },
    update: {},
    create: { slug: 'microsoft', name: 'Microsoft', description: 'Azure and Microsoft 365 certifications.' }
  });
  await db.vendor.upsert({
    where: { slug: 'comptia' },
    update: {},
    create: { slug: 'comptia', name: 'CompTIA', description: 'IT industry-standard certifications.' }
  });

  const saa = await db.exam.upsert({
    where: { slug: 'aws-saa-c03' },
    update: {},
    create: {
      vendorId: aws.id,
      slug: 'aws-saa-c03',
      code: 'SAA-C03',
      title: 'AWS Certified Solutions Architect — Associate',
      description: 'Practice for the SAA-C03 exam covering compute, storage, networking, security, and cost optimization.',
      level: 'Associate',
      durationMinutes: 130,
      passingScore: 72,
      questionCount: 65,
      domains: [
        { name: 'Design Secure Architectures', weight: 30 },
        { name: 'Design Resilient Architectures', weight: 26 },
        { name: 'Design High-Performing Architectures', weight: 24 },
        { name: 'Design Cost-Optimized Architectures', weight: 20 }
      ],
      pricePractice: 2900,
      priceBundle: 17900,
      priceVoucher: 14900,
      published: true
    }
  });

  await db.exam.upsert({
    where: { slug: 'microsoft-az-900' },
    update: {},
    create: {
      vendorId: ms.id,
      slug: 'microsoft-az-900',
      code: 'AZ-900',
      title: 'Microsoft Azure Fundamentals',
      description: 'Practice questions covering core Azure concepts, services, governance, and pricing.',
      level: 'Foundational',
      durationMinutes: 60,
      passingScore: 70,
      questionCount: 40,
      domains: [
        { name: 'Cloud concepts', weight: 25 },
        { name: 'Azure architecture and services', weight: 35 },
        { name: 'Azure management and governance', weight: 40 }
      ],
      pricePractice: 1900,
      priceBundle: 11900,
      priceVoucher: 9900,
      published: true
    }
  });

  // Sample questions for SAA-C03 (60 — 30 teaser + 30 paid)
  const existing = await db.question.count({ where: { examId: saa.id } });
  if (existing === 0) {
    const domains = ['Design Secure Architectures', 'Design Resilient Architectures', 'Design High-Performing Architectures', 'Design Cost-Optimized Architectures'];
    for (let i = 0; i < 60; i++) {
      const correctIdx = i % 4;
      const optionIds = ['a', 'b', 'c', 'd'];
      await db.question.create({
        data: {
          examId: saa.id,
          stem: `Sample SAA-C03 question #${i + 1}: which AWS service best fits scenario ${i + 1}?`,
          explanation: 'Placeholder explanation — replace with real practice content. The correct service is selected based on the scenario constraints around durability, cost, and operational overhead.',
          domain: domains[i % 4],
          difficulty: 3,
          type: QType.SINGLE,
          status: QStatus.PUBLISHED,
          generatedBy: 'manual',
          isTeaser: i < 30,
          options: [
            { id: 'a', text: 'Amazon S3' },
            { id: 'b', text: 'Amazon EC2' },
            { id: 'c', text: 'AWS Lambda' },
            { id: 'd', text: 'Amazon RDS' }
          ],
          correct: [optionIds[correctIdx]],
          references: [{ label: 'AWS Well-Architected', url: 'https://aws.amazon.com/architecture/well-architected/' }]
        }
      });
    }
  }

  console.log('Seed complete. Admin:', adminEmail);
}

main().finally(() => db.$disconnect());
