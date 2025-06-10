import Database from '../../database';

export default class LikedPresenter {
  #dbModel;
  #view;
  #storiesData;
  #storiesArray = [];

  constructor({ view }) {
    this.#view = view;
    this.#dbModel = Database;
  }

  async init() {
    let displayedStoriesFromCache = false;
    try {
      this.#view.showLoading();

      const cachedStories = await this.#dbModel.getAllStoriesFromDB();
      if (cachedStories && cachedStories.length > 0) {
        this.#storiesData = cachedStories;
        displayedStoriesFromCache = true;
      } else {
        this.#view.showError('Tidak ada Story yang anda Sukai.');
      }

      this.#prepareStoriesArray();
      this.#view.showStories(this.#storiesArray);
      this.#view.attachStoryCardListeners(this.#storiesArray);

    } catch (e) {
      console.error('Unexpected error in LikedPresenter init:', e);
      this.#view.showError('Kesalahan tidak terduga saat memuat halaman.');
      this.#storiesData = [];
      this.#prepareStoriesArray();
      this.#view.showStories(this.#storiesArray); 
    } finally {
      this.#view.hideLoading();
    }
  }

  async clearCache(){
    await this.#dbModel.clearAllStories();
    this.#view.showStories([]);
    this.#view.showError('Cache telah dihapus. Data akan dimuat dari server saat berikutnya.');
  }

  #prepareStoriesArray() {
    if (Array.isArray(this.#storiesData)) {
      this.#storiesArray = this.#storiesData;
    } else if (this.#storiesData && typeof this.#storiesData === 'object') {
      if (
        this.#storiesData.listStory &&
        Array.isArray(this.#storiesData.listStory)
      ) {
        this.#storiesArray = this.#storiesData.listStory;
      } else if (Object.values(this.#storiesData).some(Array.isArray)) {
        for (const key in this.#storiesData) {
          if (Array.isArray(this.#storiesData[key])) {
            this.#storiesArray = this.#storiesData[key];
            break;
          }
        }
      } else {
        this.#storiesArray = Object.values(this.#storiesData).filter(
          (item) => item && typeof item === 'object'
        );
      }
    } else {
      this.#storiesArray = [];
      console.warn('Data stories bukan array atau object:', this.#storiesData);
    }
  }
}
