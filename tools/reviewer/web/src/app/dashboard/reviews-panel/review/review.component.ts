import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Diff, FirebaseService, NotificationService } from '@/shared';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit {
  diffId: string;
  diff: Diff;
  diffView: Diff.AsObject;

  // Show editable button next to fields
  editable: boolean = true;
  // Fields can not be edited if status is 'SUBMITTED' or 'REVERTED'
  notEditableStatus: Array<number> = [
    Diff.Status.SUBMITTED,
    Diff.Status.REVERTED
  ];

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.diffId = this.route.snapshot.params['id'];

    // Get a single review
    this.firebaseService.getDiff(this.diffId).subscribe(
      res => {
        this.diff = res;
        this.diffView = this.diff.toObject();

        this.diff.setNumber(parseInt(this.diffId, 10));
        // Render the fields un-editable if the current diff status
        // is in the list of notEditableStatus
        this.editable = !this.notEditableStatus.includes(
          this.diff.getStatus()
        );
      },
      () => {
        // Permission Denied
      }
    );
  }

  // Upon click on a file open a single file review page showing
  // code difference and comments
  openFile(filePosition): void {
    // Build a route path on the following format /diff/<diff number>/<path>?
    // ls=<left snapshot number>&rs=<right snapshot number>
    this.router.navigate(['diff/' + this.diffId + '/' + filePosition], {
      queryParams: { ls: '1', rs: '3' }
    });
  }

  // Save needAttentionOf list and update the Diff
  saveAttentionList(name: string): void {
    if (this.diffView.needAttentionOfList.includes(name)) {
      const filtheredNeedAttentionOfList = this.diff
        .getNeedAttentionOfList()
        .filter(e => e !== name);

      this.diff.setNeedAttentionOfList(filtheredNeedAttentionOfList);
    } else {
      this.diff.addNeedAttentionOf(name);
    }
    this.updateDiff(this.diff, 'Update Need Attention List');
  }

  // TODO: refactor this method
  // Update whole diff, instead of sending a property to firebase
  // NOTICE: do not use: object[property]
  removeProperty(property: string, message: string): void {
    console.warn('Unsupported behavior');
    // this.firebaseService
    //   .removeProperty(this.diff, property)
    //   .then(() => {
    //     this.notificationService.success(message);
    //   })
    //   .catch(() => {
    //     this.notificationService.error('Some error occured');
    //   });
  }

  // Update the Diff in the DB
  updateDiff(diff: Diff, message: string): void {
    this.firebaseService.updateDiff(diff).subscribe(
      () => {
        this.notificationService.success(message);
      },
      () => {
        this.notificationService.error('Some error occured');
      }
    );
  }

  getTotalComments(): number {
    return this.diffView.threadsList
      .map(v => v.commentsList.length)
      .reduce((a, b) => a + b, 0);
  }

  getUnresolvedComments(): number {
    return this.diffView.threadsList.filter(v => !v.isDone).length;
  }
}
