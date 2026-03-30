import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'Arinova' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const promptId = url.searchParams.get('promptId');

  let injectedPrompt = null;

  if (promptId) {
    const env = (context?.cloudflare?.env as any) || process.env;
    
    const mainAppUrl = env.MAIN_APP_URL || "https://lead-gen.bestofall.in";

    if (mainAppUrl) {
      try {
        const response = await fetch(`${mainAppUrl}/api/external?promptId=${promptId}`);

        if (response.ok) {
          const data: any = await response.json();
          
          let formattedBlueprint = "";
          try {
            if (typeof data.uiBlueprint === 'object' && data.uiBlueprint !== null) {
              formattedBlueprint = JSON.stringify(data.uiBlueprint, null, 2);
            } else if (typeof data.uiBlueprint === 'string') {
              const parsed = JSON.parse(data.uiBlueprint);
              formattedBlueprint = JSON.stringify(parsed, null, 2);
            }
          } catch (e) {
            formattedBlueprint = String(data.uiBlueprint);
          }

          injectedPrompt = `${data.prompt}\n\n**THE UI BLUEPRINT:**\n\`\`\`json\n${formattedBlueprint}\n\`\`\``;
          
        } else {
          console.error('Failed to fetch prompt. Status:', response.status);
        }
      } catch (err) {
        console.error('Error fetching external prompt:', err);
      }
    } else {
      console.warn("Missing MAIN_APP_URL or NEXTAUTH_SECRET in Bolt.diy environment variables.");
    }
  }

  return json({ injectedPrompt });
};


export default function Index() {
  const { injectedPrompt } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (injectedPrompt) {
      const timer = setTimeout(() => {
        const textarea = document.querySelector('textarea');
        
        if (textarea) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(textarea, injectedPrompt);
          } else {
            textarea.value = injectedPrompt;
          }
          
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [injectedPrompt]);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
