export type CheckpointId = 'intro' | 'about' | 'experience' | 'projects' | 'contact';

export type Checkpoint = {
  id: CheckpointId;
  start: number;
  end: number;
};

const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  { id: 'intro', start: 0, end: 0.2 },
  { id: 'about', start: 0.2, end: 0.4 },
  { id: 'experience', start: 0.4, end: 0.64 },
  { id: 'projects', start: 0.64, end: 0.84 },
  { id: 'contact', start: 0.84, end: 1 }
];

export class CheckpointSystem {
  private readonly checkpoints: Checkpoint[];
  private activeId: CheckpointId = 'intro';

  constructor(checkpoints: Checkpoint[] = DEFAULT_CHECKPOINTS) {
    this.checkpoints = checkpoints;
  }

  private getCheckpointByProgress(progress: number): Checkpoint {
    return (
      this.checkpoints.find((item) => progress >= item.start && progress < item.end) ??
      this.checkpoints[this.checkpoints.length - 1]
    );
  }

  private getCheckpointById(id: CheckpointId): Checkpoint {
    return this.checkpoints.find((item) => item.id === id) ?? this.checkpoints[0];
  }

  update(progress: number, onChange: (current: CheckpointId, previous: CheckpointId) => void) {
    const checkpoint = this.getCheckpointByProgress(progress);

    if (!checkpoint || checkpoint.id === this.activeId) {
      return;
    }

    const previous = this.activeId;
    this.activeId = checkpoint.id;
    onChange(checkpoint.id, previous);
  }

  getSectionProgress(progress: number, sectionId: CheckpointId = this.activeId) {
    const section = this.getCheckpointById(sectionId);
    const range = Math.max(section.end - section.start, 0.0001);
    return Math.min(1, Math.max(0, (progress - section.start) / range));
  }

  get current() {
    return this.activeId;
  }
}
