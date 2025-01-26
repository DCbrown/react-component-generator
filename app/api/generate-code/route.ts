import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body = await request.json();

    const prompt = `Create a modern, polished React component that meets this description: ${body.text}

    Rules:
    - Use Tailwind CSS for styling with modern design principles
    - Component must have a dark background (slate-800 or similar) to contrast with white container
    - Do not include any imports, exports, or comments
    - Component must be wrapped in a render() function
    - Use React.useState instead of importing useState
    - Include modern UI patterns
    - Use solid colors and shadows for depth
    - Include loading states and feedback for interactive elements
    - Do not use gradients or animations
    - Return ONLY the component code, no explanations or comments

    Example format:
    function render() {
      function MyComponent() {
        const [state, setState] = React.useState(initialValue);
        
        return (
          <div className="bg-slate-800 rounded-xl shadow-xl p-6">
            <div className="w-full max-w-md mx-auto space-y-4">
              <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {state.title}
                </h2>
                <div className="space-y-4">
                  <button 
                    className="w-full py-3 px-6 text-lg font-semibold rounded-lg
                            bg-blue-600 text-white shadow-lg
                            hover:bg-blue-700 active:bg-blue-800
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleClick}
                  >
                    {state.buttonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      return <MyComponent />;
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a React component generator specializing in dark-themed, high-contrast UI with solid colors. Do not use gradients or animations. Always use dark backgrounds with light text for optimal contrast against white containers.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    let generatedCode = response.choices[0].message.content?.trim() || "";
    generatedCode = generatedCode.replace(/```jsx?|```/g, "").trim();

    if (!generatedCode.startsWith("function render()")) {
      generatedCode = `function render() {
      ${generatedCode}
        return <MyComponent />;
      }`;
    }

    return NextResponse.json({ generatedCode });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
