import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Music, 
  Mic, 
  Sparkles, 
  Maximize2, 
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface FeatureTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  notes?: string;
}

interface FeatureCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  tests: FeatureTest[];
}

export default function FeatureVerificationPanel() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['audio-engine']));
  const [categories, setCategories] = useState<FeatureCategory[]>([
    {
      id: 'audio-engine',
      name: 'Audio Engine',
      icon: <Music className="w-5 h-5" />,
      tests: [
        {
          id: 'recording',
          name: 'Real-time Recording',
          description: 'Verify microphone access and audio capture works without latency',
          status: 'pending',
        },
        {
          id: 'playback',
          name: 'Playback Synchronization',
          description: 'Test beat and vocal track playback stays in sync',
          status: 'pending',
        },
        {
          id: 'effects',
          name: 'Effects Chain',
          description: 'Verify EQ, compression, reverb, and delay effects apply correctly',
          status: 'pending',
        },
        {
          id: 'harmony',
          name: 'Harmony Processing',
          description: 'Test AI-powered harmony generation with pitch shifting',
          status: 'pending',
        },
        {
          id: 'waveform',
          name: 'Waveform Visualization',
          description: 'Check real-time waveform display updates smoothly',
          status: 'pending',
        },
        {
          id: 'latency',
          name: 'Low-Latency Performance',
          description: 'Verify audio latency is under 50ms on mobile devices',
          status: 'pending',
        },
      ],
    },
    {
      id: 'artist-studio',
      name: 'Artist Studio',
      icon: <Mic className="w-5 h-5" />,
      tests: [
        {
          id: 'multi-track',
          name: 'Multi-Stem Recording',
          description: 'Record multiple vocal tracks and verify they save correctly',
          status: 'pending',
        },
        {
          id: 'solo-mute',
          name: 'Solo/Mute Controls',
          description: 'Test solo and mute buttons work independently and in combination',
          status: 'pending',
        },
        {
          id: 'playback-all',
          name: 'Playback All Layers',
          description: 'Verify all unmuted tracks play together in sync',
          status: 'pending',
        },
        {
          id: 'save-project',
          name: 'Save/Load Projects',
          description: 'Test saving unfinished projects and reloading them',
          status: 'pending',
        },
        {
          id: 'volume-control',
          name: 'Individual Track Volume',
          description: 'Adjust volume sliders and verify audio levels change',
          status: 'pending',
        },
        {
          id: 'track-reorder',
          name: 'Drag-and-Drop Reordering',
          description: 'Test dragging tracks to reorder them in the studio',
          status: 'pending',
        },
      ],
    },
    {
      id: 'ai-tools',
      name: 'AI Creative Tools',
      icon: <Sparkles className="w-5 h-5" />,
      tests: [
        {
          id: 'auto-mix',
          name: 'Auto-Mix Analysis',
          description: 'Run auto-mix on active tracks and verify suggestions appear',
          status: 'pending',
        },
        {
          id: 'tone-match',
          name: 'Tone-Matching',
          description: 'Test tone-matching analysis returns valid EQ/pitch recommendations',
          status: 'pending',
        },
        {
          id: 'beat-suggest',
          name: 'Beat Suggestions',
          description: 'Verify beat recommendation panel shows compatible beats',
          status: 'pending',
        },
        {
          id: 'active-tracks',
          name: 'Active Track Detection',
          description: 'Confirm AI only analyzes unmuted/soloed tracks',
          status: 'pending',
        },
        {
          id: 'apply-suggestions',
          name: 'Apply Suggestions',
          description: 'Test applying AI suggestions updates track parameters',
          status: 'pending',
        },
        {
          id: 'caching',
          name: 'Result Caching',
          description: 'Verify AI results are cached and reused appropriately',
          status: 'pending',
        },
      ],
    },
    {
      id: 'virtual-stage',
      name: 'Virtual Stage Mode',
      icon: <Maximize2 className="w-5 h-5" />,
      tests: [
        {
          id: 'visuals',
          name: 'Dynamic Visuals',
          description: 'Check audio-reactive waveform visualizations animate smoothly',
          status: 'pending',
        },
        {
          id: 'theme-sync',
          name: 'Theme Synchronization',
          description: 'Verify background and colors change with light/dark theme',
          status: 'pending',
        },
        {
          id: 'fullscreen',
          name: 'Fullscreen Mode',
          description: 'Test entering and exiting fullscreen works correctly',
          status: 'pending',
        },
        {
          id: 'playback-controls',
          name: 'Playback Controls',
          description: 'Verify play, pause, restart, and seek controls function',
          status: 'pending',
        },
        {
          id: 'frame-rate',
          name: 'Frame Rate Performance',
          description: 'Confirm no frame drops during visualization (60fps target)',
          status: 'pending',
        },
        {
          id: 'gpu-optimization',
          name: 'GPU Optimization',
          description: 'Check GPU usage is efficient and battery-friendly',
          status: 'pending',
        },
      ],
    },
    {
      id: 'collab-rooms',
      name: 'Collab Rooms',
      icon: <Users className="w-5 h-5" />,
      tests: [
        {
          id: 'create-room',
          name: 'Create Room',
          description: 'Test creating public and invite-only collaboration rooms',
          status: 'pending',
        },
        {
          id: 'join-room',
          name: 'Join Room',
          description: 'Verify joining rooms with and without invite codes',
          status: 'pending',
        },
        {
          id: 'upload-track',
          name: 'Upload Collaborative Track',
          description: 'Test all participants can upload vocal tracks to the room',
          status: 'pending',
        },
        {
          id: 'real-time-sync',
          name: 'Real-Time Sync',
          description: 'Verify timeline and playback state syncs across participants',
          status: 'pending',
        },
        {
          id: 'chat',
          name: 'Chat Functionality',
          description: 'Test sending and receiving messages in real-time',
          status: 'pending',
        },
        {
          id: 'participant-list',
          name: 'Participant Management',
          description: 'Check participant list updates when users join/leave',
          status: 'pending',
        },
      ],
    },
    {
      id: 'mobile-optimization',
      name: 'Mobile Optimization',
      icon: <AlertCircle className="w-5 h-5" />,
      tests: [
        {
          id: 'touch-controls',
          name: 'Touch Controls',
          description: 'Verify all buttons and sliders work with touch input',
          status: 'pending',
        },
        {
          id: 'responsive-layout',
          name: 'Responsive Layout',
          description: 'Test UI adapts correctly to different screen sizes',
          status: 'pending',
        },
        {
          id: 'scroll-behavior',
          name: 'Smooth Scrolling',
          description: 'Check overscroll-behavior and webkit-overflow-scrolling work',
          status: 'pending',
        },
        {
          id: 'haptic-feedback',
          name: 'Haptic Feedback',
          description: 'Verify vibration feedback on recording start/stop and clipping',
          status: 'pending',
        },
        {
          id: 'battery-usage',
          name: 'Battery Efficiency',
          description: 'Monitor battery drain during extended recording sessions',
          status: 'pending',
        },
        {
          id: 'network-handling',
          name: 'Network Handling',
          description: 'Test behavior on slow/unstable network connections',
          status: 'pending',
        },
      ],
    },
  ]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const updateTestStatus = (categoryId: string, testId: string, status: FeatureTest['status'], notes?: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              tests: cat.tests.map(test =>
                test.id === testId ? { ...test, status, notes } : test
              ),
            }
          : cat
      )
    );
  };

  const getStatusIcon = (status: FeatureTest['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: FeatureTest['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCategoryStats = (category: FeatureCategory) => {
    const total = category.tests.length;
    const passed = category.tests.filter(t => t.status === 'pass').length;
    const failed = category.tests.filter(t => t.status === 'fail').length;
    const warnings = category.tests.filter(t => t.status === 'warning').length;
    const pending = category.tests.filter(t => t.status === 'pending').length;

    return { total, passed, failed, warnings, pending };
  };

  const getOverallStats = () => {
    const allTests = categories.flatMap(cat => cat.tests);
    const total = allTests.length;
    const passed = allTests.filter(t => t.status === 'pass').length;
    const failed = allTests.filter(t => t.status === 'fail').length;
    const warnings = allTests.filter(t => t.status === 'warning').length;
    const pending = allTests.filter(t => t.status === 'pending').length;

    return { total, passed, failed, warnings, pending };
  };

  const overallStats = getOverallStats();
  const completionPercentage = Math.round((overallStats.passed / overallStats.total) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="gradient-dimi text-white p-4 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Dimi Dev Branch - Feature Verification</h1>
          <p className="text-white/90 text-sm">
            Systematic testing checklist for all integrated features before live deployment
          </p>
        </div>
      </header>

      {/* Overall Progress */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-500">{overallStats.passed}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{overallStats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">{overallStats.warnings}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{overallStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Categories */}
      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          {categories.map(category => {
            const stats = getCategoryStats(category);
            const isExpanded = expandedCategories.has(category.id);

            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div className="p-2 rounded-lg bg-primary/10">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>
                          {stats.passed}/{stats.total} tests passed
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.failed > 0 && (
                        <Badge variant="destructive">{stats.failed} Failed</Badge>
                      )}
                      {stats.warnings > 0 && (
                        <Badge className="bg-yellow-500">{stats.warnings} Warnings</Badge>
                      )}
                      {stats.passed === stats.total && stats.total > 0 && (
                        <Badge className="bg-green-500">All Passed</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      {category.tests.map(test => (
                        <div
                          key={test.id}
                          className="bg-muted/50 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(test.status)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium mb-1">{test.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {test.description}
                                </p>
                                {test.notes && (
                                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                                    Note: {test.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(test.status)}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateTestStatus(category.id, test.id, 'pass')}
                              size="sm"
                              variant={test.status === 'pass' ? 'default' : 'outline'}
                              className="flex-1"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Pass
                            </Button>
                            <Button
                              onClick={() => updateTestStatus(category.id, test.id, 'warning', 'Minor issue detected')}
                              size="sm"
                              variant={test.status === 'warning' ? 'default' : 'outline'}
                              className="flex-1"
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Warning
                            </Button>
                            <Button
                              onClick={() => updateTestStatus(category.id, test.id, 'fail', 'Critical issue found')}
                              size="sm"
                              variant={test.status === 'fail' ? 'destructive' : 'outline'}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Fail
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="bg-card border-t border-border p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {overallStats.pending > 0 ? (
              <span>{overallStats.pending} tests remaining</span>
            ) : overallStats.failed > 0 ? (
              <span className="text-red-500 font-medium">
                {overallStats.failed} critical issues need attention
              </span>
            ) : (
              <span className="text-green-500 font-medium">
                All tests passed! Ready for deployment ✓
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const confirmed = confirm('Reset all test results?');
                if (confirmed) {
                  setCategories(prev =>
                    prev.map(cat => ({
                      ...cat,
                      tests: cat.tests.map(test => ({ ...test, status: 'pending', notes: undefined })),
                    }))
                  );
                }
              }}
            >
              Reset All
            </Button>
            <Button
              className="gradient-dimi text-white"
              disabled={overallStats.pending > 0 || overallStats.failed > 0}
            >
              Approve for Deployment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
