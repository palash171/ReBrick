import unittest

from app.builds.matcher import recommend_builds


class RecommendationMatcherTests(unittest.TestCase):
    def test_returns_phone_stand_as_full_match(self) -> None:
        inventory = {
            "red_2x4_brick": 12,
            "green_1x4_plate": 4,
            "gray_2x2_plate": 2,
        }

        result = recommend_builds(inventory, category="objects")

        self.assertEqual(result["recommendations"][0].build_id, "object-phone-stand")
        self.assertEqual(result["recommendations"][0].compatibility_score, 1.0)

    def test_partial_match_reports_missing_families(self) -> None:
        inventory = {
            "red_2x4_brick": 4,
            "black_1x2_plate": 2,
            "gray_slope_2x2": 1,
        }

        result = recommend_builds(inventory, category="buildings")
        first_recommendation = result["recommendations"][0]

        self.assertEqual(first_recommendation.build_id, "building-micro-house")
        self.assertLess(first_recommendation.compatibility_score, 1.0)
        self.assertTrue(first_recommendation.missing_families)


if __name__ == "__main__":
    unittest.main()
