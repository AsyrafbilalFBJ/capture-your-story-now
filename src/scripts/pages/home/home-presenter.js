import StoryModel from '../../data/story-api';
import Database from '../../database';

export default class HomePresenter {
  #model;
  #dbModel;
  #view;
  #storiesData;
  #storiesArray = [];

  constructor({ view }) {
    this.#model = StoryModel;
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
        this.#prepareStoriesArray();
        this.#view.showStories(this.#storiesArray);
        displayedStoriesFromCache = true;
      }

      const freshStories = await this.fetchAndCacheStoriesFromServer();

      if (freshStories && freshStories.length > 0) {
        this.#storiesData = freshStories;
      } else if (!displayedStoriesFromCache) {
        this.#storiesData = []; 
      }

      this.#prepareStoriesArray();
      this.#view.showStories(this.#storiesArray);
      this.#view.attachStoryCardListeners(this.#storiesArray);

    } catch (e) {
      console.error('Unexpected error in HomePresenter init:', e);
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

  async fetchAndCacheStoriesFromServer() {
    try {
      const response = await this.#model.getAllStories();
      if (response && response.listStory) {
        // await this.#dbModel.putAllStory(response.listStory);
        if (response.listStory.length === 0) {
          console.log('Server returned no stories. Cache updated accordingly.');
        }
        return response.listStory;
      }
      this.#view.showError('Gagal memproses data cerita dari server.');
      console.warn('Unexpected API response structure or missing listStory:', response);
      return [];
    } catch (error) {
      this.#view.showError('Gagal mengambil data cerita terbaru dari server. Menampilkan data dari cache jika tersedia.');
      console.error('Error fetching stories from server (fetchAndCacheStoriesFromServer):', error);
      return []; 
    }
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
