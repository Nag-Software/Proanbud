"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { urlForImage, formatDate } from "@/lib/sanity";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function BlogSection1() {
  const { posts, loading, error } = useBlogPosts(4);

  if (error) {
    return (
      <section className="transparent max-w-7xl mx-auto section-padding-y">
        <div className="container-padding-x container mx-auto">
          <div className="flex flex-col items-center gap-10 md:gap-12">
            <div className="section-title-gap-lg mx-auto flex max-w-xl flex-col items-center text-center">
              <Tagline>Proanbud x Blogg</Tagline>
              <h1 id="blog-section-heading" className="heading-lg">
                Siste nytt fra vår blogg
              </h1>
              <p className="text-muted-foreground">
                Les våre siste artikler om produktoppdateringer, bransjenyheter og
                tips for å få mest mulig ut av våre tjenester.
              </p>
            </div>
            <div className="text-center text-muted-foreground">
              Kunne ikke laste blogginnlegg. Prøv igjen senere.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="transparent max-w-6xl mx-auto py-16 xs:py-20"
      aria-labelledby="blog-section-heading"
    >
      <div className="container-padding-x container mx-auto gap-10 md:gap-12">
        <div className="flex flex-col items-center gap-10 md:gap-12">
          {/* Section Title */}
          <div className="section-title-gap-lg mx-auto flex max-w-xl flex-col items-center text-center">
            {/* Tagline */}
            <Tagline>Proanbud x Blogg</Tagline>
            {/* Main Heading */}
            <h1 id="blog-section-heading" className="heading-lg">
              Siste nytt fra vår blogg
            </h1>
            {/* Description */}
            <p className="text-muted-foreground">
              Les våre siste artikler om produktoppdateringer, bransjenyheter og
              tips for å få mest mulig ut av våre tjenester.
            </p>
          </div>

          {/* Blog Grid */}
          <div
            className="flex flex-wrap gap-8 md:gap-6 justify-center"
            role="list"
          >
            {loading
              ? // Loading skeletons
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-4 rounded-xl">
                    <Skeleton className="aspect-[4/3] rounded-xl" />
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))
              : // Real blog posts
                posts.map((post) => (
                  <Link
                    href={`/blogg/${post.slug.current}`}
                    key={post._id}
                    className="group block basis-full md:basis-1/2 lg:basis-1/4"
                  >
                    {/* Blog Card */}
                    <div className="flex flex-col gap-4 rounded-xl transition-all duration-200 ">
                      {/* Image Wrapper */}
                      <AspectRatio
                        ratio={4 / 3}
                        className="overflow-hidden rounded-xl bg-gradient-to-br from-secondary to-cyan-100"
                      >
                        {post.mainImage ? (
                          <Image
                            src={urlForImage(post.mainImage).width(400).height(300).url()}
                            alt={post.mainImage.alt || post.title}
                            fill
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icons.FileText className="h-16 w-16 text-white/80" />
                          </div>
                        )}
                      </AspectRatio>

                      {/* Post Content */}
                      <div className="flex flex-col gap-3">
                        {/* Post Meta */}
                        <div className="flex items-center gap-2 text-left">
                          <span className="text-muted-foreground text-sm">
                            {formatDate(post.publishedAt)}
                          </span>
                          {post.categories && post.categories.length > 0 && (
                            <>
                              <span className="text-muted-foreground text-sm">·</span>
                              <span className="text-muted-foreground text-sm">
                                {post.categories[0].title}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Post Title */}
                        <h3 className="text-base leading-normal font-semibold group-hover:underline">
                          {post.title}
                        </h3>

                        {/* Post Summary */}
                        <p className="text-muted-foreground text-sm leading-normal line-clamp-3">
                          {post.excerpt || "Les mer om dette innlegget..."}
                        </p>
                      </div>
                    </div>
                  </Link>
            ))}
          </div>
          <div className="flex justify-center align-items-center">
            <Button variant="outline" className="font-regular">
              <Link href="/blogg" className="flex items-center gap-2">
                Se alle blogginnlegg
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
