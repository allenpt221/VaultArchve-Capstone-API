import ThesisDetail from '@/components/ThesisDetail';
import axios from '@/lib/axios';
import { Metadata } from 'next';

async function getThesisById(id: string) {
  try {
    const res = await axios.get(`/repository/getbyid/${id}`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      return null;
    }

    throw error; 
  }
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const thesis = await getThesisById(id);

    if (!thesis) {
    return {
      title: "Thesis Not Found",
      description: "The requested thesis does not exist.",
    };
  }


  return {
    title: thesis.title,
    description: thesis.abstract,
    authors: [{ name: thesis.author }],
    openGraph: {
      title: thesis.title,
      description: thesis.abstract,
      type: 'article',
      publishedTime: thesis.issue_date,
    },
  };
}

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThesisDetail id={id} />;
}

export default page;