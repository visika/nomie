import nid from "../../modules/nid/nid";

// Modules
import ExtractTrackers from "../../utils/extract-trackers/extract-trackers"; // extract tracker function
import CalculateScore from "../../utils/calculate-score/calculate-score"; // Score calculator
import regexs from "../../utils/regex"; // Regex to find data points in the note

/**
 * Nomie Log / Record
 * It's been called a record since Nomie 1, but a log is a better name
 * you'll see i've used the term both thoughout - 🤦‍♂️
 */
export default class Record {
  constructor(starter) {
    starter = starter || {};

    this._dirty = starter._id ? undefined : true;
    this._id = starter._id || nid(10); // create a random 10 char id if not proviedd
    this.note = (starter.note || starter.notes || "").trim(); // Trim the note

    /**
     * Nomie uses the End date as the primary time.
     * Currently as of 4.4.1 there is no active use of start..
     */
    let end = starter.end ? new Date(starter.end) : new Date(); // set the end date
    let start = starter.start ? new Date(starter.start) : end;
    this.end = end.getTime();
    this.start = start.getTime();

    // Score Calculation
    // This Might be a bad idea - but i'm doing it anyways
    // If a score is set, use it - if not, calculate it.
    // If a score is 0 or not set
    this.score = starter.score || CalculateScore(this.note, this.end);

    // Get location
    this.lat = starter.lat || null;
    this.lng = starter.lng || null;
    this.location = starter.location || "";

    // Get if this has been edited
    this.modified = starter.modified || false;

    // Get the source if provided
    this.source = starter.source || null;

    // Associate Photo (not used )
    this.photo = starter.photo || null;
  }

  // Get a hash of this note
  hash() {
    return nid([this.note, this.start, this.end, this.lat, this.lng].join(""));
  }

  // Get it as an object
  toObject() {
    return {
      _id: this._id,
      note: this.note,
      end: this.end,
      start: this.start,
      score: this.score,
      lat: this.lat,
      lng: this.lng,
      location: this.location
    };
  }

  // add a tag to the note
  addTag(tag, value) {
    if (value) {
      this.note = `${this.note} #${tag}(${value})`;
    } else {
      this.note = `${this.note} #${tag}`;
    }
    if (this.trackers) {
      this.expand();
    }
    return this;
  }

  // Does it have a specific  tracker?
  hasTracker(trackerTag) {
    return this.trackers.hasOwnProperty(trackerTag);
  }

  // Get note length without tags
  noteTextLength() {
    let scrubbed = this.note.replace(new RegExp(regexs.tag, "gi"), "").trim();
    return scrubbed.length;
  }

  // Get the score
  positivityScore() {
    if (this.score === 1) {
      return -2;
    } else if (this.score === 2) {
      return -1;
    } else if (this.score === 4) {
      return 1;
    } else if (this.score === 5) {
      return 2;
    } else {
      return 0;
    }
  }

  // Expand for more data
  expand() {
    return this.expanded();
  }

  expanded() {
    return Object.assign(this, {
      trackers: ExtractTrackers(this.note),
      duration: this.end - this.start,
      startDate: new Date(this.start),
      endDate: new Date(this.end)
    });
  }

  // Get trackers as array
  trackersArray() {
    let tks = ExtractTrackers(this.note);

    let res = Object.keys(tks).map(key => {
      return {
        tag: tks[key].tracker,
        value: tks[key].value
      };
    });
    if (Array.isArray(res)) {
      return res;
    } else {
      return [res];
    }
  }

  // Get public verion - WTF IS THIS EVEN? I don't remember
  public(tag) {
    return {
      duration: this.end - this.start,
      geo: this.lat ? [this.lat, this.lng] : null,
      startDate: new Date(this.start),
      endDate: new Date(this.end),
      start: new Date(this.start),
      end: new Date(this.end),
      value: (this.trackers[tag] || {}).value || 0
    };
  }
}
