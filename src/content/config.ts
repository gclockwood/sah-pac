import { defineCollection, z } from "astro:content";
const helpcenter = defineCollection({
  schema: z.object({
    title: z.string(),
    intro: z.string(),
  }),
});
const changelog = defineCollection({
  schema: ({ image }) =>
    z.object({
      page: z.string(),
      description: z.string(),
      pubDate: z.date(),
      image: z.object({
        url: image(), 
        alt: z.string(),
      }),
    }),
});

const infopages = defineCollection({
  schema: z.object({
    page: z.string(),
    pubDate: z.date(),
  }),
});
const integrations = defineCollection({
  schema: ({ image }) =>
    z.object({
      email: z.string(),
      integration: z.string(),
      description: z.string(),
      permissions: z.array(z.string()),
      details: z.array(
        z.object({
          title: z.string(),
          value: z.string(),
          url: z.optional(z.string()),
        })
      ),
      logo: z.object({
        url: image(),
        alt: z.string(),
      }),
      tags: z.array(z.string()),
    }),
});
const team = defineCollection({
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string().optional(),
      bio: z.string().optional(),
      image: z.object({
        url: image(),
        alt: z.string(),
      }),
      socials: z
        .object({
          twitter: z.string().optional(),
          website: z.string().optional(),
          linkedin: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
    }),
});

const postsCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      team: z.string(),
      image: z.object({
        url: image(), 
        alt: z.string(),
      }),
      tags: z.array(z.string()),
    }),
});

const customers = defineCollection({
  schema: ({ image }) =>
    z.object({
      customer: z.string(),
      bgColor: z.string().optional(),
      ctaTitle: z.string().optional(),
      testimonial: z.string().optional(),
      partnership: z.string().optional(),
      avatar: z.object({
        url: image(),
        alt: z.string(),
      }),
      challengesAndSolutions: z.array(
        z.object({
          title: z.string(),
          content: z.string(),
        })
      ),
      results: z.array(z.string()),
      about: z.string(),
      details: z.record(z.string()),
      logo: z.object({
        url: image(),
        alt: z.string(),
      }),
    }),
});
export const collections = {
  team: team,
  customers: customers,
  infopages: infopages,
  changelog: changelog,
  helpcenter: helpcenter,
  posts: postsCollection,
  integrations: integrations,
};
