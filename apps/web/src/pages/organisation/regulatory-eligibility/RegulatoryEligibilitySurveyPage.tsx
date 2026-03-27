import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/common";
import { cn } from "@/lib/utils";

interface SurveyQuestion {
  id: string;
  surveyType: string;
  stepNumber: string;
  stepCategory: string;
  questionText: string;
  ifYes?: string;
  ifNo?: string;
  legalReference?: string;
  notes?: string;
  sortOrder: number;
}

interface SurveyResponse {
  id: string;
  questionId: string;
  answer?: string;
  notes?: string;
  question: SurveyQuestion;
}

interface Survey {
  id: string;
  surveyType: string;
  surveyVersion: string;
  status: string;
  completedAt?: string;
  isApplicable?: boolean;
  applicabilityReason?: string;
  entityClassification?: string;
  regulatoryRegime?: string;
  notes?: string;
  responses: SurveyResponse[];
  createdAt: string;
  updatedAt: string;
}

const surveyTypeLabels: Record<string, string> = {
  dora: "DORA",
  nis2: "NIS2",
};

const surveyTypeDescriptions: Record<string, string> = {
  dora: "Digital Operational Resilience Act - Assessing applicability for financial entities",
  nis2: "Network and Information Security Directive 2 - Assessing entity classification",
};

async function getSurvey(id: string): Promise<Survey> {
  const res = await fetch(`/api/organisation/regulatory-eligibility/surveys/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch survey');
  return res.json();
}

async function getQuestions(surveyType: string): Promise<SurveyQuestion[]> {
  const res = await fetch(`/api/organisation/regulatory-eligibility/questions/${surveyType}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

async function saveResponse(surveyId: string, questionId: string, answer: string, notes?: string): Promise<void> {
  const res = await fetch(`/api/organisation/regulatory-eligibility/surveys/${surveyId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ questionId, answer, notes }),
  });
  if (!res.ok) throw new Error('Failed to save response');
}

async function completeSurvey(id: string, result: {
  isApplicable?: boolean;
  applicabilityReason?: string;
  entityClassification?: string;
  regulatoryRegime?: string;
}): Promise<Survey> {
  const res = await fetch(`/api/organisation/regulatory-eligibility/surveys/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      status: 'completed',
      completedAt: new Date().toISOString(),
      ...result,
    }),
  });
  if (!res.ok) throw new Error('Failed to complete survey');
  return res.json();
}

export default function RegulatoryEligibilitySurveyPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; notes?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (surveyId) {
      loadData();
    }
  }, [surveyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const surveyData = await getSurvey(surveyId!);
      setSurvey(surveyData);

      if (surveyData.status === 'completed') {
        setShowResults(true);
      }

      const questionsData = await getQuestions(surveyData.surveyType);
      setQuestions(questionsData);

      // Load existing answers
      const existingAnswers: Record<string, { answer: string; notes?: string }> = {};
      surveyData.responses.forEach((response) => {
        existingAnswers[response.questionId] = {
          answer: response.answer || '',
          notes: response.notes,
        };
      });
      setAnswers(existingAnswers);

      // Find first unanswered question
      const firstUnanswered = questionsData.findIndex(
        (q) => !existingAnswers[q.id]?.answer
      );
      if (firstUnanswered >= 0) {
        setCurrentQuestionIndex(firstUnanswered);
      }
    } catch (err) {
      console.error("Error loading survey:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !surveyId) return;

    const existing = answers[currentQuestion.id];
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: { ...existing, answer },
    };
    setAnswers(newAnswers);

    setSaving(true);
    try {
      await saveResponse(surveyId, currentQuestion.id, answer, newAnswers[currentQuestion.id]?.notes);
    } catch (err) {
      console.error("Error saving response:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNotesChange = (notes: string) => {
    if (!currentQuestion) return;
    const existing = answers[currentQuestion.id];
    setAnswers({
      ...answers,
      [currentQuestion.id]: { answer: existing?.answer ?? "", ...existing, notes },
    });
  };

  const handleSaveNotes = async () => {
    if (!currentQuestion || !surveyId || !currentAnswer?.answer) return;
    setSaving(true);
    try {
      await saveResponse(surveyId, currentQuestion.id, currentAnswer.answer, currentAnswer.notes);
    } catch (err) {
      console.error("Error saving notes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = async () => {
    if (!surveyId || !survey) return;

    // Determine result based on answers
    const result = determineResult(survey.surveyType, answers, questions);

    try {
      setSaving(true);
      await completeSurvey(surveyId, result);
      setShowResults(true);
      loadData(); // Reload to get updated survey
    } catch (err) {
      console.error("Error completing survey:", err);
    } finally {
      setSaving(false);
    }
  };

  const determineResult = (
    surveyType: string,
    answers: Record<string, { answer: string; notes?: string }>,
    questions: SurveyQuestion[]
  ) => {
    // Simple logic - in real implementation this would follow the actual decision tree
    const yesCount = Object.values(answers).filter((a) => a.answer === 'yes').length;
    const totalAnswered = Object.values(answers).filter((a) => a.answer).length;

    if (surveyType === 'dora') {
      if (yesCount >= totalAnswered * 0.5) {
        return {
          isApplicable: true,
          regulatoryRegime: 'full',
          applicabilityReason: 'Organization meets DORA applicability criteria',
        };
      } else {
        return {
          isApplicable: false,
          regulatoryRegime: 'not_applicable',
          applicabilityReason: 'Organization does not meet DORA applicability criteria',
        };
      }
    } else {
      // NIS2
      if (yesCount >= totalAnswered * 0.7) {
        return {
          isApplicable: true,
          entityClassification: 'essential',
          applicabilityReason: 'Organization classified as Essential Entity under NIS2',
        };
      } else if (yesCount >= totalAnswered * 0.4) {
        return {
          isApplicable: true,
          entityClassification: 'important',
          applicabilityReason: 'Organization classified as Important Entity under NIS2',
        };
      } else {
        return {
          isApplicable: false,
          entityClassification: 'not_applicable',
          applicabilityReason: 'Organization does not fall under NIS2 scope',
        };
      }
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a.answer).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isComplete = answeredCount === questions.length;

  // Group questions by category
  const categories = [...new Set(questions.map((q) => q.stepCategory))];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!survey) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Survey not found</AlertDescription>
      </Alert>
    );
  }

  if (showResults) {
    return (
      <div className="space-y-6 animate-slide-up">
        <PageHeader
          title={`${surveyTypeLabels[survey.surveyType]} Assessment Results`}
          description="Your regulatory eligibility assessment has been completed"
          backLink="/organisation/regulatory-eligibility"
          backLabel="Back to Assessments"
        />

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {survey.isApplicable ? (
                <Scale className="h-8 w-8 text-primary" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-success" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {survey.isApplicable ? "Regulation Applies" : "Not Applicable"}
            </CardTitle>
            <CardDescription className="text-base">
              {survey.applicabilityReason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Regulation</p>
                <p className="font-medium">{surveyTypeLabels[survey.surveyType]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={survey.isApplicable ? "default" : "secondary"}>
                  {survey.isApplicable ? "Applicable" : "Not Applicable"}
                </Badge>
              </div>
              {survey.surveyType === 'nis2' && survey.entityClassification && (
                <div>
                  <p className="text-sm text-muted-foreground">Classification</p>
                  <Badge variant={survey.entityClassification === 'essential' ? "default" : "secondary"}>
                    {survey.entityClassification === 'essential' ? 'Essential Entity' :
                     survey.entityClassification === 'important' ? 'Important Entity' : 'N/A'}
                  </Badge>
                </div>
              )}
              {survey.surveyType === 'dora' && survey.regulatoryRegime && (
                <div>
                  <p className="text-sm text-muted-foreground">Regime</p>
                  <Badge variant={survey.regulatoryRegime === 'full' ? "default" : "secondary"}>
                    {survey.regulatoryRegime === 'full' ? 'Full Regime' :
                     survey.regulatoryRegime === 'simplified' ? 'Simplified' : 'N/A'}
                  </Badge>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-medium">
                  {survey.completedAt ? new Date(survey.completedAt).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions Answered</p>
                <p className="font-medium">{answeredCount} / {questions.length}</p>
              </div>
            </div>

            {survey.isApplicable && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Based on your responses, your organization is subject to {surveyTypeLabels[survey.surveyType]} requirements.
                  Consider reviewing the compliance requirements and creating an implementation plan.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/organisation/regulatory-eligibility')}>
                Back to Assessments
              </Button>
              <Button onClick={() => setShowResults(false)}>
                Review Answers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={`${surveyTypeLabels[survey.surveyType]} Eligibility Assessment`}
        description={surveyTypeDescriptions[survey.surveyType]}
        backLink="/organisation/regulatory-eligibility"
        backLabel="Back"
      />

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} of {questions.length} questions answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Question Navigation */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Questions</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {categories.map((category) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 px-2">
                      {category}
                    </p>
                    {questions
                      .filter((q) => q.stepCategory === category)
                      .map((q, idx) => {
                        const globalIdx = questions.findIndex((qq) => qq.id === q.id);
                        const isAnswered = !!answers[q.id]?.answer;
                        const isCurrent = globalIdx === currentQuestionIndex;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(globalIdx)}
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors",
                              isCurrent && "bg-primary/10 text-primary",
                              !isCurrent && isAnswered && "text-muted-foreground",
                              !isCurrent && !isAnswered && "hover:bg-secondary"
                            )}
                          >
                            {isAnswered ? (
                              <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-muted-foreground flex-shrink-0" />
                            )}
                            <span className="truncate">{q.stepNumber}</span>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <div className="col-span-9">
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{currentQuestion.stepCategory}</Badge>
                  <Badge variant="secondary">Step {currentQuestion.stepNumber}</Badge>
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.questionText}
                </CardTitle>
                {currentQuestion.legalReference && (
                  <CardDescription className="flex items-center gap-1 mt-2">
                    <FileText className="h-3 w-3" />
                    {currentQuestion.legalReference}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Answer Buttons */}
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    variant={currentAnswer?.answer === 'yes' ? 'default' : 'outline'}
                    className={cn(
                      "flex-1 h-16 text-lg",
                      currentAnswer?.answer === 'yes' && "bg-success hover:bg-success/90"
                    )}
                    onClick={() => handleAnswer('yes')}
                    disabled={saving}
                  >
                    Yes
                  </Button>
                  <Button
                    size="lg"
                    variant={currentAnswer?.answer === 'no' ? 'default' : 'outline'}
                    className={cn(
                      "flex-1 h-16 text-lg",
                      currentAnswer?.answer === 'no' && "bg-destructive hover:bg-destructive/90"
                    )}
                    onClick={() => handleAnswer('no')}
                    disabled={saving}
                  >
                    No
                  </Button>
                  <Button
                    size="lg"
                    variant={currentAnswer?.answer === 'not_applicable' ? 'default' : 'outline'}
                    className="flex-1 h-16 text-lg"
                    onClick={() => handleAnswer('not_applicable')}
                    disabled={saving}
                  >
                    N/A
                  </Button>
                </div>

                {/* Guidance */}
                {currentAnswer?.answer && (
                  <Alert className={cn(
                    currentAnswer.answer === 'yes' && "border-success/50 bg-success/5",
                    currentAnswer.answer === 'no' && "border-destructive/50 bg-destructive/5"
                  )}>
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                      {currentAnswer.answer === 'yes' && currentQuestion.ifYes}
                      {currentAnswer.answer === 'no' && currentQuestion.ifNo}
                      {currentAnswer.answer === 'not_applicable' && "This question does not apply to your organization."}
                      {!currentQuestion.ifYes && !currentQuestion.ifNo && currentAnswer.answer !== 'not_applicable' && "Your response has been recorded."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    placeholder="Add any relevant notes or context..."
                    value={currentAnswer?.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNotesChange(e.target.value)}
                    onBlur={handleSaveNotes}
                    rows={3}
                  />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button onClick={handleNext} disabled={!currentAnswer?.answer}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleComplete}
                      disabled={!isComplete || saving}
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete Assessment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {questions.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No questions found for this survey type. Please contact support.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
