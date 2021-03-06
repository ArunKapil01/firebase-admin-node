/*!
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as admin from '../../lib/index';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {clone} from 'lodash';
import {DocumentReference} from '@google-cloud/firestore';

chai.should();
chai.use(chaiAsPromised);

const mountainView = {
  name: 'Mountain View',
  population: 77846,
};

describe('admin.firestore', () => {

  let reference: DocumentReference;

  before(() => {
    reference = admin.firestore().collection('cities').doc();
  });

  it('admin.firestore() returns a Firestore client', () => {
    const firestore = admin.firestore();
    expect(firestore).to.be.instanceOf(admin.firestore.Firestore);
  });

  it('app.firestore() returns a Firestore client', () => {
    const firestore = admin.app().firestore();
    expect(firestore).to.be.instanceOf(admin.firestore.Firestore);
  });

  it('supports basic data access', () => {
    return reference.set(mountainView)
      .then(result => {
        return reference.get();
      })
      .then(snapshot => {
        let data = snapshot.data();
        expect(data).to.deep.equal(mountainView);
        return reference.delete();
      })
      .then(result => {
        return reference.get();
      })
      .then(snapshot => {
        expect(snapshot.exists).to.be.false;
      });
  }).timeout(5000);

  it('admin.firestore.FieldValue.serverTimestamp() provides a server-side timestamp', () => {
    let expected: any = clone(mountainView);
    expected.timestamp = admin.firestore.FieldValue.serverTimestamp();
    return reference.set(expected)
      .then(result => {
        return reference.get();
      })
      .then(snapshot => {
        let data = snapshot.data();
        expect(data.timestamp).is.not.null;
        expect(data.timestamp instanceof Date).is.true;
        return reference.delete();
      })
      .should.eventually.be.fulfilled;
  }).timeout(5000);

  it('admin.firestore.FieldPath type is defined', () => {
    expect(typeof admin.firestore.FieldPath).to.be.not.undefined;
  });

  it('admin.firestore.FieldValue type is defined', () => {
    expect(typeof admin.firestore.FieldValue).to.be.not.undefined;
  });

  it('admin.firestore.GeoPoint type is defined', () => {
    expect(typeof admin.firestore.GeoPoint).to.be.not.undefined;
  });

  it('supports saving references in documents', () => {
    const source = admin.firestore().collection('cities').doc();
    const target = admin.firestore().collection('cities').doc();
    return source.set(mountainView)
      .then(result => {
        return target.set({name: 'Palo Alto', sisterCity: source});
      })
      .then(result => {
        return target.get();
      })
      .then(snapshot => {
        let data = snapshot.data();
        expect(data.sisterCity.path).to.deep.equal(source.path);
        let promises = [];
        promises.push(source.delete());
        promises.push(target.delete());
        return Promise.all(promises);
      })
      .should.eventually.be.fulfilled;
  }).timeout(5000);

  it('admin.firestore.setLogFunction() enables logging for the Firestore module', () => {
    const logs = [];
    const source = admin.firestore().collection('cities').doc();
    admin.firestore.setLogFunction((log) => {
      logs.push(log);
    });
    return source.set({name: 'San Francisco'})
      .then(result => {
        return source.delete();
      })
      .then(result => {
        expect(logs.length).greaterThan(0);
      });
  }).timeout(5000);
});
