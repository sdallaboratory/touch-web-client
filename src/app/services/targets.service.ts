import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Target } from '../models/target';
import { ApiService } from './api.service';
import _ from 'lodash';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { Student } from '../models/student';
@Injectable({
  providedIn: 'root'
})
export class TargetsService {

  constructor(
    private readonly api: ApiService,
    private readonly storage: StorageService
  ) {
    const targets = this.storage.getTargets();
    if (targets) {
      for (const target of targets) {
        this.addGroup(target.group, target.students);
      }
    }
  }

  private targets: Target[] = [];

  private readonly targetsSubject = new BehaviorSubject<Target[]>(this.targets);

  public readonly targetsObservable = this.targetsSubject.asObservable().pipe(
    map(targets => targets.length ? targets : null),
  );

  public readonly targetsStudents = this.targetsSubject.asObservable().pipe(
    map(targets => _.flatten(targets.map(t => t.students || []))),
    map(students => students.length ? students : null),
  );

  public addStudent(student: Student) {
    // TODO: Implement as needed
    const target = this.targetsSubject.value.find(t => t.group === student.group);
    if (target) {
      if (!target.students) {
        target.students = [student];
      } else {
        target.students.push(student);
      }
      this.targetsSubject.next(this.targets);
      this.storage.setTargets(this.targets);
    } else {
      this.addGroup(student.group, [student]);
    }
  }

  public addGroup(group: string, students?: Student[]) {
    const existedTarget = this.targets.find(t => t.group === group);
    if (existedTarget) {
      return existedTarget;
    }

    const schedulePromise = this.api.getSchedule(group).toPromise();

    const target: Target = {
      group,
      color: '#000000dd',
      schedulePromise,
      scheduleLoaded: false,
      students
    };

    schedulePromise.then((d) => {
      target.scheduleLoaded = true;
    });

    this.targets.push(target);
    this.targetsSubject.next(this.targets);
    this.storage.setTargets(this.targets);

    return target;
  }

  public removeGroup(group: string) {
    const target = this.targets.find(t => t.group === group);
    _.remove(this.targets, target);
    this.targetsSubject.next(this.targets);
    this.storage.setTargets(this.targets);
    return target;
  }

  public clear() {
    this.targets = [];
    this.targetsSubject.next(this.targets);
    this.storage.setTargets(this.targets);
  }

}
