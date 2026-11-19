import { PatternStudy } from "@/components/patterns/PatternStudy";

type Props = {
  params: Promise<{ patternId: string }>;
};

export default async function PatternPage({ params }: Props) {
  const { patternId } = await params;
  return <PatternStudy patternId={patternId} />;
}
