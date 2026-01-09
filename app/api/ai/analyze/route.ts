import { NextRequest, NextResponse } from 'next/server';
import { analyzeResponsesAndGenerateTheme } from '@/lib/gemini';
import { Question, ChoiceAnswer } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const { questions, choiceAnswers } = await req.json() as {
            questions: Question[];
            choiceAnswers: ChoiceAnswer[];
        };

        // AIが回答を分析してテーマと初期質問を生成
        const result = await analyzeResponsesAndGenerateTheme(questions, choiceAnswers);

        return NextResponse.json(result);
    } catch (error) {
        console.error('AI analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze responses' },
            { status: 500 }
        );
    }
}
