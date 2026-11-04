import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LeaderboardService } from '../../app/core/leaderboard/leaderboard.service';
import { LucideMedal } from '@lucide/angular';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DecimalPipe, LucideMedal],
  templateUrl: './classement.html',
})
export class ClassementComponent implements OnInit {
  protected readonly board = inject(LeaderboardService);

  ngOnInit(): void {
    void this.board.load();
  }
}