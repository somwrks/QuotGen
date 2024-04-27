import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { generateAQuote, quoteQueryName } from "@/src/graphql/queries";
import { GraphQLResult } from "aws-amplify/api";
import {
  BackgroundImage1,
  BackgroundImage2,
  FooterCon,
  FooterLink,
  GenerateQuoteButton,
  GenerateQuoteButtonText,
  GradientBackgroundCon,
  QuoteGeneratorCon,
  QuoteGeneratorInnerCon,
  QuoteGeneratorSubTitle,
  QuoteGeneratorTitle,
  RedSpan,
} from "@/components/QGen/QGenElements";

import Head from "next/head";
import QuoteGeneratorModal from "@/components/QGen";
const inter = Inter({ subsets: ["latin"] });
interface UpdateInfo {
  id: string;
  queryName: string;
  quotesGenerated: number;
  createdAt: string;
  updatedAt: string;
}
Amplify.configure({
  API: {
    GraphQL: {
      endpoint:
        "https://6tzd2dmxtjclffonfcq3s7ifge.appsync-api.us-east-2.amazonaws.com/graphql",
      region: "us-east-2",
      defaultAuthMode: "apiKey",
      apiKey: "da2-jrqli5e7cba4rbs43beg35ofqm",
    },
  },
});

function isGraphQLResultForquotesQueryName(
  response: any
): response is GraphQLResult<{
  quotesQueryName: {
    items: [UpdateInfo];
  };
}> {
  return (
    response.data &&
    response.data.quotesQueryName &&
    response.data.quotesQueryName.items
  );
}
interface GenerateAQuoteData {
  generateAQuote: {
    statusCode: number;
    headers: { [key: string]: string };
    body: string;
  };
}
export default function Home() {
  const [openGenerator, setOpenGenerator] = useState(false);
  const [processingQuote, setProcessingQuote] = useState(false);
  const [quoteReceived, setQuoteReceived] = useState<String | null>(null);
  const update = async () => {
    const client = generateClient();
    const r = await client.graphql<UpdateInfo>({
      query: quoteQueryName,
      variables: {
        queryName: "LIVE",
      },
    });
    if (isGraphQLResultForquotesQueryName(r) && r) {
      setn(r.data.quotesQueryName.items[0].quotesGenerated);
    }
  };
  const handleCloseGenerator = () => {
    setOpenGenerator(false);
    setProcessingQuote(false);
    setQuoteReceived(null);
  };
  useEffect(() => {
    update();
  }, []);
  const handleOpenGenerator = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setOpenGenerator(true);
    setProcessingQuote(true);
    try {
      // Run Lambda Function
      const runFunction = "runFunction";
      const runFunctionStringified = JSON.stringify(runFunction);
      const client = generateClient();
      const r = await client.graphql<GenerateAQuoteData>({
        query: generateAQuote,
        variables: {
          input: runFunctionStringified,
        },
      });
      const responseStringified = JSON.stringify(r);
      const responseReStringified = JSON.stringify(responseStringified);
      const bodyIndex = responseReStringified.indexOf("body=") + 5;
      const bodyAndBase64 = responseReStringified.substring(bodyIndex);
      const bodyArray = bodyAndBase64.split(",");
      const body = bodyArray[0];
      console.log(body);
      setQuoteReceived(body);
      setProcessingQuote(false);
      update();

    } catch (error) {
      console.log("error generating quote:", error);
      setProcessingQuote(false);
    }
  };

  const [n, setn] = useState<Number | null>(0);
  return (
    <>
      <Head>
        <title>QuotGen</title>
        <meta name="description" content="A fun project to generate quotes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GradientBackgroundCon>
        <QuoteGeneratorModal
          open={openGenerator}
          close={handleCloseGenerator}
          processingQuote={processingQuote}
          setProcessingQuote={setProcessingQuote}
          quoteReceived={quoteReceived}
          setQuoteReceived={setQuoteReceived}
        />
        <QuoteGeneratorCon>
          <QuoteGeneratorInnerCon>
            <QuoteGeneratorTitle>
              Daily Inspiration Generator
            </QuoteGeneratorTitle>

            <QuoteGeneratorSubTitle>
              inspiration? Generate {" "}
              <FooterLink
                href="https://zenquotes.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ZenQuotes API
              </FooterLink>
              .
            </QuoteGeneratorSubTitle>
            <GenerateQuoteButton onClick={handleOpenGenerator}>
              <GenerateQuoteButtonText>Make Quote</GenerateQuoteButtonText>
            </GenerateQuoteButton>
          </QuoteGeneratorInnerCon>
        </QuoteGeneratorCon>
        <>
            Quotes Generated: {n}
          
           
          </>
      </GradientBackgroundCon>
    </>
  );
}
