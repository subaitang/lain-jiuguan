
export interface Holiday {
    month: number; // 0-11
    day: number;
    name: {
        en: string;
        zh: string;
        jp: string;
    };
}

export interface CountryData {
    name: string;
    cities: string[];
    holidays: Holiday[];
}

export const GEO_DATABASE: Record<string, CountryData> = {
    "Japan": {
        name: "Japan",
        cities: ["Tokyo", "Osaka", "Kyoto", "Nagoya", "Yokohama", "Shibuya"],
        holidays: [
            { month: 0, day: 1, name: { en: "Ganjitsu", zh: "元旦", jp: "元日" } },
            { month: 1, day: 11, name: { en: "National Foundation Day", zh: "建国纪念日", jp: "建国記念の日" } },
            { month: 4, day: 5, name: { en: "Children's Day", zh: "儿童节", jp: "こどもの日" } },
            { month: 7, day: 11, name: { en: "Mountain Day", zh: "山之日", jp: "山の日" } },
            { month: 10, day: 3, name: { en: "Culture Day", zh: "文化节", jp: "文化の日" } },
            { month: 10, day: 23, name: { en: "Labor Thanksgiving Day", zh: "勤劳感谢日", jp: "勤労感謝の日" } }
        ]
    },
    "China": {
        name: "China",
        cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hangzhou"],
        holidays: [
            { month: 0, day: 1, name: { en: "New Year's Day", zh: "元旦", jp: "元旦" } },
            { month: 2, day: 8, name: { en: "Women's Day", zh: "妇女节", jp: "女性の日" } },
            { month: 4, day: 1, name: { en: "Labor Day", zh: "劳动节", jp: "労働節" } },
            { month: 5, day: 1, name: { en: "Children's Day", zh: "儿童节", jp: "こどもの日" } },
            { month: 9, day: 1, name: { en: "National Day", zh: "国庆节", jp: "国慶節" } }
        ]
    },
    "USA": {
        name: "USA",
        cities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Seattle", "Austin"],
        holidays: [
            { month: 0, day: 1, name: { en: "New Year's Day", zh: "元旦", jp: "元旦" } },
            { month: 6, day: 4, name: { en: "Independence Day", zh: "独立日", jp: "独立記念日" } },
            { month: 10, day: 11, name: { en: "Veterans Day", zh: "退伍军人节", jp: "復員軍人の日" } },
            { month: 11, day: 25, name: { en: "Christmas", zh: "圣诞节", jp: "クリスマス" } }
        ]
    },
    "UK": {
        name: "UK",
        cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Liverpool"],
        holidays: [
            { month: 0, day: 1, name: { en: "New Year's Day", zh: "元旦", jp: "元旦" } },
            { month: 11, day: 25, name: { en: "Christmas", zh: "圣诞节", jp: "クリスマス" } },
            { month: 11, day: 26, name: { en: "Boxing Day", zh: "节礼日", jp: "ボクシング・デー" } }
        ]
    }
};
