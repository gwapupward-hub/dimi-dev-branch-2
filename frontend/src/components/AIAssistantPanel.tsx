import { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Music,
  Wand2,
  TrendingUp,
  Check,
  X as XIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAIAnalysis } from '../hooks/useQueries';
import type { Beat } from '../backend';

interface AudioTrack {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  audioElement: HTMLAudioElement;
  order: number;
}

interface AIAssistantPanelProps {
  tracks: AudioTrack[];
  beat: Beat;
  onApplySuggestion: (trackId: string, suggestion: AISuggestion) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export interface AISuggestion {
  type: 'auto-mix' | 'tone-match' | 'beat-recommend';
  trackId?: string;
  title: string;
  description: string;
  parameters: Record<string, number | string>;
  applied: boolean;
}

export default function AIAssistantPanel({
  tracks,
  beat,
  onApplySuggestion,
  isCollapsed,
  onToggleCollapse,
}: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<'auto-mix' | 'tone-match' | 'beat-recommend'>('auto-mix');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  
  const { analyzeAutoMix, analyzeToneMatch, analyzeBeatRecommendations } = useAIAnalysis();

  const handleAutoMixAnalysis = async () => {
    if (tracks.length === 0) {
      toast.error('No tracks to analyze');
      return;
    }

    try {
      const result = await analyzeAutoMix.mutateAsync({
        trackIds: tracks.map(t => t.id),
        beatId: beat.id,
      });

      const newSuggestions: AISuggestion[] = result.recommendations.map((rec: any, idx: number) => ({
        type: 'auto-mix',
        trackId: rec.trackId,
        title: `Balance Track ${idx + 1}`,
        description: rec.description,
        parameters: rec.parameters,
        applied: false,
      }));

      setSuggestions(newSuggestions);
      toast.success('Auto-mix analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze tracks');
      console.error(error);
    }
  };

  const handleToneMatchAnalysis = async () => {
    if (tracks.length === 0) {
      toast.error('No tracks to analyze');
      return;
    }

    try {
      const result = await analyzeToneMatch.mutateAsync({
        trackIds: tracks.map(t => t.id),
        beatId: beat.id,
      });

      const newSuggestions: AISuggestion[] = result.recommendations.map((rec: any, idx: number) => ({
        type: 'tone-match',
        trackId: rec.trackId,
        title: `Tone Adjustment ${idx + 1}`,
        description: rec.description,
        parameters: rec.parameters,
        applied: false,
      }));

      setSuggestions(newSuggestions);
      toast.success('Tone matching analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze tone matching');
      console.error(error);
    }
  };

  const handleBeatRecommendations = async () => {
    try {
      const result = await analyzeBeatRecommendations.mutateAsync({
        beatId: beat.id,
      });

      const newSuggestions: AISuggestion[] = result.recommendations.map((rec: any) => ({
        type: 'beat-recommend',
        title: rec.title,
        description: rec.description,
        parameters: rec.parameters,
        applied: false,
      }));

      setSuggestions(newSuggestions);
      toast.success('Beat recommendations ready!');
    } catch (error) {
      toast.error('Failed to get beat recommendations');
      console.error(error);
    }
  };

  const handleApply = (suggestion: AISuggestion, index: number) => {
    if (suggestion.trackId) {
      onApplySuggestion(suggestion.trackId, suggestion);
      setSuggestions(prev => 
        prev.map((s, i) => i === index ? { ...s, applied: true } : s)
      );
      toast.success('Suggestion applied!');
    }
  };

  const handleIgnore = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
    toast.info('Suggestion ignored');
  };

  const isAnalyzing = analyzeAutoMix.isPending || analyzeToneMatch.isPending || analyzeBeatRecommendations.isPending;

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={`relative h-full bg-card border-l border-border transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-12' : 'w-80 sm:w-96'
        }`}
      >
        {/* Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="icon"
              className="absolute -left-4 top-4 z-10 h-8 w-8 rounded-full bg-card border border-border shadow-lg hover:shadow-glow-blue transition-all duration-200"
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isCollapsed ? 'Open AI Assistant' : 'Close AI Assistant'}
          </TooltipContent>
        </Tooltip>

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-full gradient-dimi shadow-glow-blue">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">AI Assistant</TooltipContent>
            </Tooltip>
            
            <Separator className="w-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <Wand2 className="w-5 h-5 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">Auto-Mix</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">Tone Match</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <Music className="w-5 h-5 text-accent-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">Beat Recommendations</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border gradient-dimi">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 rounded-full bg-white/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">AI Assistant</h2>
              </div>
              <p className="text-xs text-white/80">Smart audio processing & creative support</p>
            </div>

            {/* Tool Tabs */}
            <div className="flex border-b border-border bg-muted/30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab('auto-mix')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 transition-all duration-200 ${
                      activeTab === 'auto-mix'
                        ? 'bg-card border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Auto-Mix</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Auto-Mix Suggestions</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab('tone-match')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 transition-all duration-200 ${
                      activeTab === 'tone-match'
                        ? 'bg-card border-b-2 border-secondary text-secondary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Tone Match</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Tone Matching Analyzer</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab('beat-recommend')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 transition-all duration-200 ${
                      activeTab === 'beat-recommend'
                        ? 'bg-card border-b-2 border-accent-foreground text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Beats</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Beat Recommendations</TooltipContent>
              </Tooltip>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-4">
              {activeTab === 'auto-mix' && (
                <div className="space-y-4">
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        <span>Auto-Mix Analysis</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Analyze vocal tracks and get real-time balance & EQ recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleAutoMixAnalysis}
                        disabled={isAnalyzing || tracks.length === 0}
                        className="w-full gradient-dimi text-white hover:opacity-90 transition-all duration-200 active:scale-95"
                      >
                        {analyzeAutoMix.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Analyze Tracks
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {suggestions.filter(s => s.type === 'auto-mix').map((suggestion, idx) => (
                    <SuggestionCard
                      key={idx}
                      suggestion={suggestion}
                      onApply={() => handleApply(suggestion, idx)}
                      onIgnore={() => handleIgnore(idx)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'tone-match' && (
                <div className="space-y-4">
                  <Card className="border-secondary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-secondary" />
                        <span>Tone Matching</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Compare vocals to beat and suggest EQ or pitch adjustments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleToneMatchAnalysis}
                        disabled={isAnalyzing || tracks.length === 0}
                        className="w-full bg-secondary hover:bg-secondary/90 text-white transition-all duration-200 active:scale-95"
                      >
                        {analyzeToneMatch.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Analyze Tone
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {suggestions.filter(s => s.type === 'tone-match').map((suggestion, idx) => (
                    <SuggestionCard
                      key={idx}
                      suggestion={suggestion}
                      onApply={() => handleApply(suggestion, idx)}
                      onIgnore={() => handleIgnore(idx)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'beat-recommend' && (
                <div className="space-y-4">
                  <Card className="border-accent/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Music className="w-4 h-4 text-accent-foreground" />
                        <span>Beat Recommendations</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Find compatible beats based on key, tempo, and mood
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleBeatRecommendations}
                        disabled={isAnalyzing}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 active:scale-95"
                      >
                        {analyzeBeatRecommendations.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Finding...
                          </>
                        ) : (
                          <>
                            <Music className="w-4 h-4 mr-2" />
                            Find Beats
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {suggestions.filter(s => s.type === 'beat-recommend').map((suggestion, idx) => (
                    <SuggestionCard
                      key={idx}
                      suggestion={suggestion}
                      onApply={() => handleApply(suggestion, idx)}
                      onIgnore={() => handleIgnore(idx)}
                    />
                  ))}
                </div>
              )}

              {suggestions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block p-4 rounded-full bg-muted/50 mb-4">
                    <Sparkles className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No suggestions yet</p>
                  <p className="text-xs mt-1">Run an analysis to get AI-powered recommendations</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
  onIgnore,
}: {
  suggestion: AISuggestion;
  onApply: () => void;
  onIgnore: () => void;
}) {
  return (
    <Card className={`transition-all duration-200 ${suggestion.applied ? 'opacity-60 border-green-500/50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{suggestion.title}</CardTitle>
            <CardDescription className="text-xs mt-1">{suggestion.description}</CardDescription>
          </div>
          {suggestion.applied && (
            <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
              <Check className="w-3 h-3 mr-1" />
              Applied
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          {Object.entries(suggestion.parameters).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium">{typeof value === 'number' ? value.toFixed(1) : value}</span>
            </div>
          ))}
        </div>
        {!suggestion.applied && (
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={onApply}
              size="sm"
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all duration-200 active:scale-95"
            >
              <Check className="w-3 h-3 mr-1" />
              Apply
            </Button>
            <Button
              onClick={onIgnore}
              size="sm"
              variant="outline"
              className="flex-1 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-95"
            >
              <XIcon className="w-3 h-3 mr-1" />
              Ignore
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
