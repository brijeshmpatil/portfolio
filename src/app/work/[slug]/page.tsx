import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyBody } from "@/components/case-study/CaseStudyBody";
import { CaseStudyHeader } from "@/components/case-study/CaseStudyHeader";
import { CaseStudyNav } from "@/components/case-study/CaseStudyNav";
import { CASE_STUDIES, getProject } from "@/content/projects";

type Params = { readonly slug: string };

/** Every case study is known at build time, so all of them are prerendered. */
export function generateStaticParams(): Params[] {
  return CASE_STUDIES.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) return {};

  return {
    title: project.name,
    description: project.summary,
    openGraph: {
      title: `${project.name} — ${project.tagline}`,
      description: project.summary,
      type: "article",
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  // A card-depth project has no case study to render, so an otherwise valid
  // slug still 404s here rather than rendering an empty page.
  if (!project || project.depth !== "case-study") notFound();

  const index = CASE_STUDIES.findIndex((p) => p.slug === project.slug);

  return (
    <article className="pb-24">
      <CaseStudyHeader project={project} />
      <CaseStudyBody sections={project.sections} />
      <CaseStudyNav
        previous={CASE_STUDIES[index - 1]}
        next={CASE_STUDIES[index + 1]}
      />
    </article>
  );
}
