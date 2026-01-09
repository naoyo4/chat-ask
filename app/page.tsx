export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        ChatAsk
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-gray-300 mb-12">
                        AIを活用した対話型アンケート・インタビューアプリケーション
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-16">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">📝</div>
                            <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                                アンケート作成
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                選択式質問とAI対話を組み合わせたアンケートを簡単に作成
                            </p>
                            <a
                                href="/create"
                                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                            >
                                作成を始める
                            </a>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">📊</div>
                            <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                                結果を見る
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                収集したデータを分析し、インサイトを発見
                            </p>
                            <a
                                href="/results"
                                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                            >
                                結果を確認
                            </a>
                        </div>
                    </div>

                    <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                            主な機能
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div>
                                <div className="text-2xl mb-2">🤖</div>
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">AI対話</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    自由記述欄でAIが対話形式で深掘りインタビュー
                                </p>
                            </div>
                            <div>
                                <div className="text-2xl mb-2">⚡</div>
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">簡単操作</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Google Formのようなシンプルで直感的なUI
                                </p>
                            </div>
                            <div>
                                <div className="text-2xl mb-2">📈</div>
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">詳細分析</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    自動要約とキーワード抽出で効率的な分析
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
